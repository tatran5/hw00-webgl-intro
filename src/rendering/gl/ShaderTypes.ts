
import ShaderProgram, { Shader } from "./ShaderProgram"

export enum ShaderTypes {
	lambert = "lambert",
	perlin = "perlin",
	fbm = "fbm"
}

export function getShaderProgram(shaderType: ShaderTypes, gl: WebGL2RenderingContext): ShaderProgram {
	switch (shaderType) {
		case ShaderTypes.lambert:
			return getLambertShaderProgram(gl);
		case ShaderTypes.perlin:
			return getPerlinShaderProgram(gl);
		case ShaderTypes.fbm:
			return getFbmShaderProgram(gl);
	}
}

function getLambertShaderProgram(gl: WebGL2RenderingContext): ShaderProgram {
	return new ShaderProgram([
		new Shader(gl.VERTEX_SHADER, require('../../shaders/lambert-vert.glsl')),
		new Shader(gl.FRAGMENT_SHADER, require('../../shaders/lambert-frag.glsl')),
	]);
}

function getPerlinShaderProgram(gl: WebGL2RenderingContext): ShaderProgram {
	return new ShaderProgram([
		new Shader(gl.VERTEX_SHADER, require('../../shaders/lambert-vert.glsl')),
		new Shader(gl.FRAGMENT_SHADER, require('../../shaders/perlin-frag.glsl')),
	]);
}

function getFbmShaderProgram(gl: WebGL2RenderingContext): ShaderProgram {
	return new ShaderProgram([
		new Shader(gl.VERTEX_SHADER, require('../../shaders/lambert-vert.glsl')),
		new Shader(gl.FRAGMENT_SHADER, require('../../shaders/fbm-frag.glsl')),
	]);
}
