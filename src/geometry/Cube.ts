import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

const VERTEX_PER_TRIANGLE_COUNT = 3;

class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }


  /**
   * @override
   */
  generateIdx(): void {
    this.indices = new Uint32Array([
      0, 1, 2, 0, 2, 3, // Front triangles.
      4, 5, 6, 4, 6, 7, // Back triangles.
      8, 9, 10, 8, 10, 11, // Right triangles.
      12, 13, 14, 12, 14, 15, // Left triangles.
      16, 17, 18, 16, 18, 19, // Top triangles.
      20, 21, 22, 20, 22, 23]); // Right triangles.
    super.generateIdx();
  }

  /**
   * @override
   */
  generatePos(): void {
    this.positions = new Float32Array([
      // Front triangles.
      -1, -1, 1, 1, //0
      -1, 1, 1, 1, //1
      1, 1, 1, 1, //2
      1, -1, 1, 1, //3
      // Back triangles.
      -1, 1, -1, 1, //4
      1, 1, -1, 1, //5
      1, -1, -1, 1, //6
      -1, -1, -1, 1, //7
      // Right triangles.
      1, -1, -1, 1, //8
      1, -1, 1, 1, //9
      1, 1, 1, 1, //10
      1, 1, -1, 1, //11
      // Left triangles.
      -1, -1, -1, 1, //12
      -1, -1, 1, 1, //13
      -1, 1, 1, 1, //14
      -1, 1, -1, 1, //15
      // Top triangles.
      -1, 1, -1, 1, //16
      1, 1, -1, 1, //17
      1, 1, 1, 1, //18
      -1, 1, 1, 1, //19
      // Bottom triangles.
      -1, -1, -1, 1, //20
      1, -1, -1, 1, //21
      1, -1, 1, 1, //22
      -1, -1, 1, 1 //23
    ]);
    super.generatePos();
  }

  /**
   * @override
   */
  generateNor(): void {
    this.normals = new Float32Array(
      [
        // Front triangles.
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        // Back triangles.
        0, 0, -1, 0,
        0, 0, -1, 0,
        0, 0, -1, 0,
        0, 0, -1, 0,
        // Right triangles.
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        // Left triangles.
        -1, 0, 0, 0,
        -1, 0, 0, 0,
        -1, 0, 0, 0,
        -1, 0, 0, 0,
        // Top triangles.
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        // Bottom triangles.
        0, -1, 0, 0,
        0, -1, 0, 0,
        0, -1, 0, 0,
        0, -1, 0, 0
      ]
    );
    super.generateNor();
  }

  create() {
    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created square`);
  }
};

export default Cube;
