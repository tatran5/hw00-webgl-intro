import { FragmentShaderTypes, VertexShaderTypes } from "./ShaderTypes";

export interface ShadingControls {
	color: number[];
	vertexShader: VertexShaderTypes;
	fragmentShader: FragmentShaderTypes;
	"grid per unit": number;
	octaves: number;
	persistence: number;
}