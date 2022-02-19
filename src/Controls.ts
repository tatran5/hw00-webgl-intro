import { GeometryTypes } from "./geometry/GeometryTypes"
import { VertexShaderTypes, FragmentShaderTypes } from "./rendering/gl/ShaderTypes";


export interface Controls {
	tesselations: 5,
	geometry: GeometryTypes.cube
	color: number[];
	vertexShader: VertexShaderTypes;
	fragmentShader: FragmentShaderTypes;
	"grid per unit": number;
	octaves: number;
	persistence: number;
}