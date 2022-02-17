export interface PerlinNoise {
	gridCountPerUnit: number
}

export interface PerlinFbmNoise extends PerlinNoise {
	persistence: number,
	octavesCount: number
}