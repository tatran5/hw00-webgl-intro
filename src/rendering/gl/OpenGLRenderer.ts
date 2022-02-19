import { mat4, vec4 } from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import { gl } from '../../globals';
import ShaderProgram from './ShaderProgram';

interface RenderOptions {
	camera: Camera;
	shaderProgram: ShaderProgram;
	drawables: Array<Drawable>;
	color: vec4;
	gridPerUnit?: number;
	octaves?: number;
	persistence?: number;
}

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(options: RenderOptions) {
    const {camera, shaderProgram, drawables, color} = options
		let model = mat4.create();
    let viewProj = mat4.create();

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    shaderProgram.setModelMatrix(model);
    shaderProgram.setViewProjMatrix(viewProj);
		
		const warpedTime = 0.5 + 0.5 * Math.cos(Date.now() / 1000.0);
		shaderProgram.setTime(warpedTime);
    shaderProgram.setGeometryColor(color);

		if (options.gridPerUnit) shaderProgram.setGridPerUnit(options.gridPerUnit);
		if (options.octaves) shaderProgram.setOctaves(options.octaves);
		if (options.persistence) shaderProgram.setPersistence(options.persistence);
		
		
    for (let drawable of drawables) {
      shaderProgram.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
