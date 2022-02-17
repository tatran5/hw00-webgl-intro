import { ShadingControls } from "./rendering/gl/ShadingControls"
import { GeometryTypes } from "./geometry/GeometryTypes"

export interface  ObjectControls {
	tesselations: 5,
	geometry: GeometryTypes.cube
}

export interface Controls {
	object: ObjectControls,
	shading: ShadingControls
}

/**
 * Return a new controls that has the same settings as the input controls.
 * NOTE: this is assuming that both ObjectControls and ShadingControls only has 
 * primitive variables.
 */
export function cloneControls(source: Controls) {
	const clonedObject = Object.assign({}, source.object);
	const clonedShading = Object.assign({}, source.shading);
	return {
		object: clonedObject,
		shading: clonedShading
	}
}