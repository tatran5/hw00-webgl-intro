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
import ShaderProgram from "./rendering/gl/ShaderProgram";
import { FragmentShaderTypes, getFragmentShader, getVertexShader, isPerlinShader, VertexShaderTypes } from "./rendering/gl/ShaderTypes";
import { Controls, cloneControls } from "./Controls"

let cube: Cube;
let icosphere: Icosphere;
let square: Square;
let shaderProgram: ShaderProgram;

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI"s functions that add GUI elements.
const curControls : Controls = {
	object: {
		tesselations: 5,
		geometry: GeometryTypes.cube
	}, 
	shading: {
		color: [0, 255, 255],
		vertexShader: VertexShaderTypes.default,
		fragmentShader: FragmentShaderTypes.lambert,
		// Related to Perlin noise.
		"grid per unit": 4.0,
		// Related to fbm.
		octaves: 10,
		persistence: 0.5	
	}
};
let lastControls = cloneControls(curControls);

function loadScene() {
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, curControls.object.tesselations);
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
	const { object, shading } = curControls;
  gui.add(object, "tesselations", 0, 8).step(1);
  gui.add(object, "geometry", Object.values(GeometryTypes));
  gui.addColor(shading, "color");
  gui.add(shading, "vertexShader", Object.values(VertexShaderTypes));
	gui.add(shading, "fragmentShader", Object.values(FragmentShaderTypes));
	if (isPerlinShader(shading.fragmentShader) ) {
		const perlinFolder = gui.addFolder("Perlin");
		perlinFolder.add(shading, "grid per unit", 1, 10).step(1);
		if (shading.fragmentShader === FragmentShaderTypes.perlinFbm) {
			perlinFolder.add(shading, "octaves", 1, 20).step(1);
			perlinFolder.add(shading, "persistence", 0.1, 1.0).step(0.1);
		}
		perlinFolder.open()
	}
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

/**
 * Detect whether the control is updated with a new shader value.
 */
function hasShaderChanged(): boolean {
	const curShading = curControls.shading;
	const lastShading = lastControls.shading;
	const isFragmentShaderChanged = curShading.fragmentShader !== lastShading.fragmentShader;
	const isVertexShaderChange = curShading.vertexShader !== lastShading.vertexShader;
	return isFragmentShaderChanged || isVertexShaderChange;
}

function main() {
  const stats = addFramerateDisplay();
  let gui = new DAT.GUI();
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
		getVertexShader(curControls.shading.vertexShader, gl),
		getFragmentShader(curControls.shading.fragmentShader, gl)
	]);
	
  // This function will be called every frame.
  function tick() {
    stats.begin();
		if (hasShaderChanged()) {
			console.log("ShaderChanged")
			shaderProgram = new ShaderProgram([
				getVertexShader(curControls.shading.vertexShader, gl),
				getFragmentShader(curControls.shading.fragmentShader, gl)
			]);
			gui.destroy()
			gui = new DAT.GUI();
  		addGuiControls(gui);
		}

    camera.update();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

		const curObject = curControls.object;
		const lastObject = lastControls.object;


    if (curObject.tesselations != lastObject.tesselations) {
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, lastObject.tesselations);
      icosphere.create();
    }
    // Normalize color to [0, 1].
    const color = vec3.fromValues(curControls.shading.color[0] / 256.0,
      curControls.shading.color[1] / 256.0,
      curControls.shading.color[2] / 256.0);

    renderer.render(camera, shaderProgram, [getChosenGeometry(curControls.object.geometry)],
      vec4.fromValues(color[0], color[1], color[2], 1)
    );
		lastControls = cloneControls(curControls);
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
