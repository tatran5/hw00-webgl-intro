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

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float gridWidth = 0.25;

vec3 noise3d(vec3 p) {
  return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 191.999)),
												dot(p, vec3(269.5, 183.3, 765.54)),
												dot(p, vec3(420.69, 631.2, 109.21))))
					* 42758.5453);
} 

// Compute the dot product between 
// - a generated "random" gradient of the grid point
// - the distance vector from the grid to the input point
float influence(vec3 p, vec3 grid) {
    vec3 gridGradient = normalize(noise3d(grid));
    vec3 distanceV = p - grid;
    return dot(gridGradient, distanceV);
} 

float blend(float x) {
    return 6.f * x * x * x * x * x +
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
		float xLower = floor(p.x / gridWidth) * gridWidth;
		float yLower = floor(p.y / gridWidth) * gridWidth;
		float zLower = floor(p.z / gridWidth) * gridWidth;

		float xUpper = xLower + gridWidth;
		float yUpper = yLower + gridWidth;
		float zUpper = zLower + gridWidth;

		// Coordinates of the 8 corners / grid points.
		vec3 pLBF = vec3(xLower, yLower, zLower);
    vec3 pLBB = vec3(xLower, yLower, zUpper);
    vec3 pLTB = vec3(xLower, yUpper, zUpper);
    vec3 pLTF = vec3(xLower, yUpper, zLower);
    vec3 pRTF = vec3(xUpper, yUpper, zLower);
    vec3 pRTB = vec3(xUpper, yUpper, zUpper);
    vec3 pRBB = vec3(xUpper, yLower, zUpper);
    vec3 pRBF = vec3(xUpper, yLower, zLower);

    // Calculate influence of each lattice point on the input point.
    // Lattice point is each integer point surrounding the input point Because this is 3d, there are 8 points to be calculated
    // as these points make up a cube encapsulating the input.
    // Notation: [L/R (left/right)] [B/T (bottom/top)] [F/B (front/back)]
    float iLBF = influence(p, pLBF);
    float iLBB = influence(p, pLBB);
    float iLTB = influence(p, pLTB);
    float iLTF = influence(p, pLTF);
    float iRTF = influence(p, pRTF);
    float iRTB = influence(p, pRTB);
    float iRBB = influence(p, pRBB);
    float iRBF = influence(p, pRBF);

		// Interpolate weights.
		float wx = 1.0 - (p.x - xLower) / gridWidth;
		float wy = 1.0 - (p.y - yLower) / gridWidth;
		float wz = 1.0 - (p.z - zLower) / gridWidth;

		// Interpolate between left and right influence values.
		float iTF = mix(iLTF, iRTF, wx);
		float iBF = mix(iLBF, iRBF, wx);
		float iTB = mix(iLTB, iRTB, wx);
		float iBB = mix(iLBB, iRBB, wx);

		// Interpolate between top and bottom influence values.
		float iF = mix(iBF, iTF, wy);
		float iB = mix(iBB, iTB, wy);

		// Interpolate between front and back influence values.
		float i = mix(iF, iB, wz);

    return i;
}

// Fractal Brownian Motion.
float fbm(vec3 p) {
    float noiseSum = 0.f;
    // Decay of amplitude as frequency increases.
    float persistence = 0.5f;
    // Number of noise functions accounted.
    int octavesCount = 4;
    // Influence on the number of "bumps" in a noise function.        
    float frequency = 1.f;
    // Influence on the vertical magnitude of the "bumps" in a noise function.
    float amplitude = 1.f;

    // Loop through the noise functions and sum up the noise.
    for (int i = 0; i < octavesCount; i++) {
        // As index i increases, the magnitude decreases (persistence < 1).
        // Accumulate contributions in total.
        noiseSum += perlinNoise3d(p);

        // Change the amplitude and frequency to use for the next noise function.
        amplitude *= persistence;
        frequency *= 2.f;    
    }
    return noiseSum;
}


void main()
{
    // Material base color (before shading)
    vec4 diffuseColor = u_Color;

    // Calculate the diffuse term for Lambert shading
    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    // Avoid negative lighting values
    //diffuseTerm = clamp(diffuseTerm, 0, 1);

    float ambientTerm = 0.2;

    float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                        //to simulate ambient lighting. This ensures that faces that are not
                                                        //lit by our point light are not completely black.

    // Compute final shaded color
    //out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
    float noise = perlinNoise3d(fs_Pos.xyz);
		out_Col = vec4(noise, noise, noise, 1.f);
}
