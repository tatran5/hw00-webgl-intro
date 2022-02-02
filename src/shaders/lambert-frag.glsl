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

// Range is [-1, 1]
float noise1d(int x) {
    x = (x << 3) ^ x;
    return (1.0 - float((x * (x * x * 15731 + 789221) 
        + 1376312589) & 0x7fffffff)) / 10737741824.0;
}

vec3 noise3d(vec3 p) {
    float nx = noise1d(int(p.x));
    float ny = noise1d(int(p.y));
    float nz = noise1d(int(p.z));
    return vec3(nx, ny, nz);
} 

// Compute the dot product between 
// - a generated "random" gradient of the first input.
// - the distance vector between the first input and the second input.
float influence(vec3 p1, vec3 p2) {
    vec3 p1Gradient = normalize(noise3d(p1));
    vec3 distanceV = p2 - p1;
    return dot(p1Gradient, distanceV);
} 

float blend(float x) {
    return 6.f * x * x * x * x * x +
        15.f * x * x * x * x +
        10.f * x * x * x;
}

// TODO: summarize how perlin noise generates
float perlinNoise3d(vec3 p) {
    vec3 floor = vec3(floor(p.x), floor(p.y), floor(p.z));
    vec3 ceil = floor + vec3(1.f);

    // Calculate influence of each lattice point on the input point.
    // Lattice point is each integer point surrounding the input point Because this is 3d, there are 8 points to be calculated
    // as these points make up a cube encapsulating the input.
    // Notation: [L/R (left/right)] [B/T (bottom/top)] [F/B (front/back)]
    float iLBF = influence(vec3(floor.x, floor.y, floor.z), p);
    float iLBB = influence(vec3(floor.x, floor.y, ceil.z), p);
    float iLTB = influence(vec3(floor.x, ceil.y, ceil.z), p);
    float iLTF = influence(vec3(floor.x, ceil.y, floor.z), p);
    float iRTF = influence(vec3(ceil.x, ceil.y, floor.z), p);
    float iRTB = influence(vec3(ceil.x, ceil.y, ceil.z), p);
    float iRBB = influence(vec3(ceil.x, floor.y, ceil.z), p);
    float iRBF = influence(vec3(ceil.x, floor.y, floor.z), p);

    // Interpolation of p between left and right points on an edge.
    // Notation: [B/T (bottom/top)] [F/B (front/back)]
    float iTF = mix(iLTF, iRTF, blend(p.x));
    float iTB = mix(iLBB, iRBB, blend(p.x));
    float iBF = mix(iLBF, iRBF, blend(p.x));
    float iBB = mix(iLBB, iRBB, blend(p.x));

    // Interpolation of p between the points on top front and top back edge.
    float iT = mix(iTF, iTB, blend(p.z));
    // Interpolation of p between the points on top front and top back edge.
    float iB = mix(iBF, iBB, blend(p.z));

    return mix(iB, iT, blend(p.y));
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
