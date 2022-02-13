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
import { FragmentShaderTypes, getFragmentShader, getVertexShader, VertexShaderTypes } from "./rendering/gl/ShaderTypes";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI"s functions that add GUI elements.
const controls = {
  tesselations: 5,
  color: [0, 255, 255],
  geometry: GeometryTypes.cube,
  vertexShader: VertexShaderTypes.default,
	fragmentShader: FragmentShaderTypes.lambert
};

let cube: Cube;
let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;
let shaderProgram: ShaderProgram;
let lastVertexShader: VertexShaderTypes = controls.vertexShader;
let lastFragmentShader: FragmentShaderTypes = controls.fragmentShader;

function loadScene() {
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
}

function getChosenGeometry(geometryType: GeometryTypes) {
  switch (geometryType) {
    case GeometryTypes.cube:
      return cube;
    case GeometryTypes.sphere:
      return icosphere;
    case GeometryTypes.square:
      return square;
  }
}

function addGuiControls(gui: DAT.GUI) {
  gui.add(controls, "tesselations", 0, 8).step(1);
  gui.addColor(controls, "color");
  gui.add(controls, "geometry", Object.values(GeometryTypes));
  gui.add(controls, "vertexShader", Object.values(VertexShaderTypes));
	gui.add(controls, "fragmentShader", Object.values(FragmentShaderTypes));
}

/**
 * Add initial display for framerate.
 */
function addFramerateDisplay(): any {
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);
  return stats;
}

function main() {
  const stats = addFramerateDisplay();
  const gui = new DAT.GUI();
  addGuiControls(gui);

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

  shaderProgram = new ShaderProgram([
		getVertexShader(controls.vertexShader, gl),
		getFragmentShader(controls.fragmentShader, gl)
	]);
	
  // This function will be called every frame.
  function tick() {
		const isVertexShaderChanged = lastVertexShader !== controls.vertexShader;
		const isFragmentShaderChanged = lastFragmentShader !== controls.fragmentShader;
		const isShaderChanged = isVertexShaderChanged || isFragmentShaderChanged;
		if (isShaderChanged) {
			lastVertexShader = controls.vertexShader;
			lastFragmentShader = controls.fragmentShader;
			shaderProgram = new ShaderProgram([
				getVertexShader(controls.vertexShader, gl),
				getFragmentShader(controls.fragmentShader, gl)
			])
		}

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

    renderer.render(camera, shaderProgram, [getChosenGeometry(controls.geometry)],
      vec4.fromValues(color[0], color[1], color[2], 1)
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
