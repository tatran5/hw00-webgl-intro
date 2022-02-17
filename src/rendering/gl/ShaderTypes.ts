
import { Shader } from "./ShaderProgram"

export enum FragmentShaderTypes {
	lambert = "lambert",
	perlin = "perlin",
	perlinFbm = "perlin fbm"
}

export function isPerlinShader(shader: FragmentShaderTypes) {
	return shader === FragmentShaderTypes.perlin || shader === FragmentShaderTypes.perlinFbm;
}

export function getFragmentShader(shaderType: FragmentShaderTypes, gl: WebGL2RenderingContext): Shader {
	switch (shaderType) {
		case FragmentShaderTypes.lambert: 
			return new Shader(gl.FRAGMENT_SHADER, require('../../shaders/fragment/lambert-frag.glsl'));
		case FragmentShaderTypes.perlin:
			return new Shader(gl.FRAGMENT_SHADER, require('../../shaders/fragment/perlin-frag.glsl'));
		case FragmentShaderTypes.perlinFbm:
			return new Shader(gl.FRAGMENT_SHADER, require('../../shaders/fragment/perlin-fbm-frag.glsl'));
	}
}

export enum VertexShaderTypes {
	default = "default",
	sin = "sin"
}

export function getVertexShader(shaderType: VertexShaderTypes, gl: WebGL2RenderingContext): Shader {
	switch (shaderType) {
		case VertexShaderTypes.sin:
			return new Shader(gl.VERTEX_SHADER, require('../../shaders/vertex/sin-vert.glsl'));
		default: 
			return new Shader(gl.VERTEX_SHADER, require('../../shaders/vertex/default-vert.glsl'));
	}
}
