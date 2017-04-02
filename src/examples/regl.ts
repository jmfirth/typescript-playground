import * as defaults from '../defaults';

export const definitions = {
  ...defaults.definitions,
  ...{
    'regl/index.d.ts': 'https://raw.githubusercontent.com/jmfirth/DefinitelyTyped/regl-support/types/regl/index.d.ts',
    'gl-matrix/index.d.ts': 'https://unpkg.com/@types/gl-matrix@2.2.34/index.d.ts',
  }
};

export const html = '';

export const css = `
html, body {
  margin: 0;
  padding: 0;
}
`;

export const code = `// an example of shader with regl
import REGL = require('regl');
import * as glMatrix from 'gl-matrix';
const regl = REGL();

const xCells = 50;
const yCells = 50;
const zCells = 50;

let field = generateField(xCells, yCells, zCells, 0.15);

function generateField(xCells: number, yCells: number, zCells: number, random: number = 0): number[][][] {
  return new Array(xCells).fill(null).map(() =>
    new Array(yCells).fill(null).map(() =>
      new Array(zCells).fill(null).map(() => Math.random() < random ? 1 : 0)
    )
  )
}

function evolveField(previous: number[][][]): number[][][] {
  const next = generateField(xCells, yCells, zCells);
  for (let x = 1; x < previous.length - 1; x++) {
    for (let y = 1; y < previous[x].length - 1; y++) {
      for (let z = 1; z < previous[x][y].length - 1; z++) {


        let n = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (!dx && !dy && !dz) {
                n += 0;
              } else {
                n += previous[x + dx][y + dy][z + dz] > 0 ? 1 : 0;
              }
            }
          }
        }
        next[x][y][z] = (previous[x][y][z] >= 1 && (5 <= n && n <= 7))
                     || (previous[x][y][z] === 0 && (6 <= n && n <= 6))
                      ? 1
                      : 0;
      }
    }
  }
  return next;
}

const unravel = (a: number[][][]): number[][] => {
  return a
    .map((b: Array<number[]>, x: number) =>
      b.map((c: number[], y: number) =>
        c.map((d: number, z: number) => d > 0 ? [x, y, z] : null).filter(Boolean) as Array<number[]>
      )
    )
    .reduce(
      (p1: Array<number[]>, c1: number[][][]) =>
        p1.concat(c1.reduce((p2, c2) => p2.concat(c2), [])),
      []
    );
};


let drawParticles = (ar: number[][]): Function => {
  const options: regl.ProgramOptions = {
    frag: \`
  precision mediump float;
  uniform vec4 color;
  void main () {
    if (length(gl_PointCoord.xy - 0.5) > 0.5) {
      discard;
    }
    gl_FragColor = color;
  }
  \`,

    vert: \`
  precision mediump float;
  attribute vec3 position;
  uniform float time;
  uniform mat4 view, projection;
  void main () {
  gl_PointSize = 5.0;
    gl_Position = projection * view * vec4(2. * position, 4.);
  }
  \`,

    attributes: {
      position: ar,
    },

    uniforms: {
      view: ({tick}: any) => {
        const t = 0.01 * tick
        return glMatrix.mat4.lookAt(
          [],
          [60 * Math.cos(t), 30, 60 * Math.sin(t)],
          [0, 0, 0],
          [0, 1, 0]
        );
      },
      projection: ({viewportWidth, viewportHeight}: any) =>
        glMatrix.mat4.perspective(
          [],
          Math.PI / 4,
          viewportWidth / viewportHeight,
          0.01,
          10000
        ),
      color: [0.06, 0.8, 0.5, 1],
      time: ({tick}: any) => tick * 0.0005
    },

    count: ar.length,

    primitive: 'points',
  };
  return regl(options);
}

regl.frame(() => {
  regl.clear({
    color: [0.05, 0.05, 0.15, 1],
    depth: 1,
  });
  drawParticles(unravel(field))();
  field = evolveField(field);
});
`;