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
import { ShaderProgram } from "./rendering/gl/ShaderProgram";
import { FragmentShaderTypes, getFragmentShader, getVertexShader, isPerlinShader, VertexShaderTypes } from "./rendering/gl/ShaderTypes";
import { Controls } from "./Controls";

let cube: Cube;
let icosphere: Icosphere;
let square: Square;
let shaderProgram: ShaderProgram;

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI"s functions that add GUI elements.
const curControls : Controls = {
	tesselations: 5,
	geometry: GeometryTypes.cube,
	color: [0, 255, 255],
	vertexShader: VertexShaderTypes.default,
	fragmentShader: FragmentShaderTypes.lambert,
	// Related to Perlin noise.
	"grid per unit": 4.0,
	// Related to fbm.
	octaves: 10,
	persistence: 0.5
};
let lastControls = Object.assign({}, curControls);

function loadScene() {
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, curControls.tesselations);
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
  gui.add(curControls, "tesselations", 0, 8).step(1);
  gui.add(curControls, "geometry", Object.values(GeometryTypes));
  gui.addColor(curControls, "color");
  gui.add(curControls, "vertexShader", Object.values(VertexShaderTypes));
	const fragmentShaderController = gui.add(curControls, "fragmentShader", Object.values(FragmentShaderTypes));
	
	const perlinFolder = gui.addFolder("Perlin");
	perlinFolder.add(curControls, "grid per unit", 1, 10).step(1);
	perlinFolder.hide();

	const fbmFolder = gui.addFolder("Fractal Brownian Motion");
	fbmFolder.add(curControls, "octaves", 1, 20).step(1);
	fbmFolder.add(curControls, "persistence", 0.1, 1.0).step(0.1);	
	fbmFolder.hide();

	fragmentShaderController.onChange((val: FragmentShaderTypes) => {
		switch (val) {
			case FragmentShaderTypes.lambert:
				perlinFolder.hide();
				fbmFolder.hide();
				break;
			case FragmentShaderTypes.perlin:
				console.log('epe')
				perlinFolder.show();
				perlinFolder.open();
				fbmFolder.hide();
				break;
			case FragmentShaderTypes.perlinFbm:
				perlinFolder.show();
				perlinFolder.open();
				fbmFolder.show();
				fbmFolder.open();
				break;
		}
	})
	
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

function areShadersEqual(c1: Controls, c2: Controls): boolean {
	return c1.vertexShader === c2.vertexShader && c1.fragmentShader === c2.fragmentShader;
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
		getVertexShader(curControls.vertexShader, gl),
		getFragmentShader(curControls.fragmentShader, gl)
	]);
	
  // This function will be ca:lled every frame.
  function tick() {
    stats.begin();

		if (!areShadersEqual(curControls, lastControls)) {
			shaderProgram = new ShaderProgram([
				getVertexShader(curControls.vertexShader, gl),
				getFragmentShader(curControls.fragmentShader, gl)
			]);
		}

    camera.update();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();


    if (curControls.tesselations != curControls.tesselations) {
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, curControls.tesselations);
      icosphere.create();
    }
    // Normalize color to [0, 1].
    const color = vec3.fromValues(curControls.color[0] / 256.0,
      curControls.color[1] / 256.0,
      curControls.color[2] / 256.0);

    renderer.render({
			camera, 
			shaderProgram, 
			drawables: [getChosenGeometry(curControls.geometry)],
      color: vec4.fromValues(color[0], color[1], color[2], 1),
			gridPerUnit: curControls["grid per unit"],
			octaves: curControls.octaves,
			persistence: curControls.persistence
		});
		lastControls = Object.assign({}, curControls);
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
