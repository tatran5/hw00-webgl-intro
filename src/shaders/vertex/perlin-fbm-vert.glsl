#version 300 es

/*
	This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
	is used to apply matrix transformations to the arrays of vertex data passed to it.
	Since this code is run on your GPU, each vertex is transformed simultaneously.
	If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
	This simultaneous transformation allows your program to run much faster, especially when rendering
	geometry with millions of vertices.
*/
precision highp float;

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform float u_Time;

// The number of grids used for Perlin noise per unit length.
uniform float u_GridPerUnit;

// The number of noise function iterations to add up, used for Fractal Brownian Motion.
uniform int u_Octaves;

// Decay of amplitude as frequency increases after each iteration, used for Fractal Brownian Motion.
uniform float u_Persistence; 


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

// Fractal Brownian Motion.
float fbm(vec3 p) {
	float noiseSum = 0.f;
	float persistence = 0.5f;
	// Influence on the number of "bumps" in a noise function.        
	float frequency = 1.f;
	// Influence on the vertical magnitude of the "bumps" in a noise function.
	float amplitude = 1.f;

	// Loop through the noise functions and sum up the noise.
	for (int i = 0; i < u_Octaves; i++) {
		// As index i increases, the magnitude decreases (persistence < 1).
		// Accumulate contributions in total.
		noiseSum += amplitude * perlinNoise3d(p, frequency);

		// Change the amplitude and frequency to use for the next noise function.
		amplitude *= u_Persistence;
		frequency *= 2.f;    
	}
	return noiseSum;
}

void main()
{
	fs_Col = vs_Col;

  mat3 invTranspose = mat3(u_ModelInvTr);
	/*
		Pass the vertex normals to the fragment shader for interpolat
		Transform the geometry's normals by the inverse transpose of the 
		model matrix. This is necessary to ensure the normals remain
		perpendicular to the surface after the surface is transformed
		the model matrix.
  */
	fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

	float noise = fbm(vs_Pos.xyz); 
	vec4 warped_vs_Pos = vec4(fbm * vs_Nor.xyz) + vs_Pos

	vec4 modelposition = u_Model * warped_vs_Pos;   // Temporarily store the transformed vertex positions for use below

	fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies
	gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
	fs_Pos = modelposition;  
}
