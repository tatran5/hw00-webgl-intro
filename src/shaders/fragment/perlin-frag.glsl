#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform float u_GridPerUnit;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

// Range: [-1, 1].
vec3 random3d(vec3 p) {
  // Range of this is from [0, 1];
	vec3 rand01 = fract(sin(vec3(dot(p, vec3(127.1, 311.7, 191.999)),
												dot(p, vec3(269.5, 183.3, 765.54)),
												dot(p, vec3(420.69, 631.2, 109.21))))
					* 42758.5453);
	return rand01 * 2.0 -  vec3(1.0);
} 

// Compute the dot product between 
// - a generated "random" gradient of the grid point
// - the distance vector from the grid to the input point
float influence(vec3 grid, vec3 p) {
    vec3 gridGradient = normalize(random3d(grid));
    vec3 distanceV = p - grid;
    return dot(gridGradient, distanceV);
} 

vec3 blend(vec3 x) {
    return 6.f * x * x * x * x * x -
        15.f * x * x * x * x +
        10.f * x * x * x;
}

float fallOff(vec3 p, vec3 grid) {
	float t = distance(p, grid); // Linear.
	t = t * t * t * (t * (t * 6.0 - 15.0) + 10.0); // Quintic, 6t^5 - 15t^4 + 10t^3.
	return 1.0 - t; // Want more weight the closer we are.
}

// TODO: summarize how perlin noise generates
float perlinNoise3d(vec3 p) {
		// Input point in grid space.
		vec3 pg = u_GridPerUnit * p;
		vec3 g000 = floor(pg);

		vec3 w = blend(fract(pg));

		float i000 = influence(g000, pg);
		float i001 = influence(g000 + vec3(0.0, 0.0, 1.0), pg);
		float i00 = mix(i000, i001, w.z);

		float i010 = influence(g000 + vec3(0.0, 1.0, 0.0), pg);
		float i011 = influence(g000 + vec3(0.0, 1.0, 1.0), pg);
		float i01 = mix(i010, i011, w.z);

		float i100 = influence(g000 + vec3(1.0, 0.0, 0.0), pg);
		float i101 = influence(g000 + vec3(1.0, 0.0, 1.0), pg);
		float i10 = mix(i100, i101, w.z);

		float i110 = influence(g000 + vec3(1.0, 1.0, 0.0), pg);
		float i111 = influence(g000 + vec3(1.0, 1.0, 1.0), pg);
		float i11 = mix(i110, i111, w.z);

		float i0 = mix(i00, i01, w.y);
		float i1 = mix(i10, i11, w.y);
		float i = mix(i0, i1, w.x);
    return i + 0.2;
}

void main()
{
    // Material base color (before shading)
    vec4 diffuseColor = u_Color;

    // Calculate the diffuse term for Lambert shading
    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    // Avoid negative lighting values
   	diffuseTerm = min(max(diffuseTerm, 0.0), 1.0);

    float ambientTerm = 0.2;

    float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                        //to simulate ambient lighting. This ensures that faces that are not
                                                        //lit by our point light are not completely black.

    // Compute final shaded color
    float noise = perlinNoise3d(fs_Pos.xyz);
		out_Col = u_Color * vec4(lightIntensity * vec3(noise), 1.f);
}
