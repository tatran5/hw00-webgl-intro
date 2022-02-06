import { vec3, vec4 } from "gl-matrix";
const Stats = require("stats-js");
import * as DAT from "dat.gui";
import Cube from "./geometry/Cube";
import Icosphere from "./geometry/Icosphere";
import Square from "./geometry/Square";
import { GeometryTypes } from "./geometry/GeometryTypes";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { setGL } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";

// import {
// 	getLambertShaderProgram,
// 	getPerlinShaderProgram
// } from "./rendering/gl/ShaderConstants.js";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI"s functions that add GUI elements.
const controls = {
  tesselations: 5,
	color: [0, 255, 255],
	geometry: GeometryTypes.square,
  "Load Scene": loadScene, // A function pointer, essentially
};

let cube: Cube;
let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;

function loadScene() {
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
}

function getChosenGeometry(geometryType: GeometryTypes) {
	switch(geometryType) {
		case GeometryTypes.cube:
			return cube;
		case GeometryTypes.sphere:
			return icosphere;
		case GeometryTypes.square:
			return square;
	}
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, "tesselations", 0, 8).step(1);
	gui.addColor(controls, "color");
	gui.add(controls, "geometry", [GeometryTypes.cube, GeometryTypes.square, GeometryTypes.sphere]);
  gui.add(controls, "fragment", []);
	gui.add(controls, "Load Scene");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2 not supported!");
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/lambert-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/lambert-frag.glsl")),
  ]);

  // This function will be called every frame.
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if (controls.tesselations != prevTesselations) {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

		// Normalize color to [0, 1].
		const color = vec3.fromValues(controls.color[0] / 256.0, 
			controls.color[1] / 256.0, 
			controls.color[2] / 256.0);

    renderer.render(camera, lambert, [getChosenGeometry(controls.geometry)],
      vec4.fromValues(color[0], color[1], color[2],  1)
    );
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame.
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
