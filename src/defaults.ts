export const preactSource = `
import { h, Component, render } from 'preact';
import * as PIXI from 'pixi.js';

class HelloWorld extends Component<void, void> {
  render() {
    return (
      <div>
        <h1>Hello world!</h1>

      </div>
    );
  }
}

render(<HelloWorld />, document.body);
`;

export const pixiSource = `// an example of drawing with PIXI.js
import * as PIXI from 'pixi.js';

let renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = null;

let stage: PIXI.Container = null;

let rafHandle: number = null;

function start(container) {
  renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
  renderer.autoResize = true;
  renderer.view.style.height = '100%';
  renderer.view.style.width = '100%';
  container.appendChild(renderer.view);

  stage = new PIXI.Container();
  update(0);
}

function update(tick: number) {
  rafHandle = requestAnimationFrame(update);
  renderer.render(stage);
  stage.removeChildren();
  drawStar(tick);
  drawRect(tick);
  drawCircle(tick);
}

function drawCircle(tick: number) {
  const circle = new PIXI.Graphics();
  circle.beginFill(0xFFFFFF);
  circle.lineStyle(5, 0xFF0000);
  circle.drawCircle(
    Math.sin(tick / 1000) * (window.innerWidth / 2 * 0.8) + (window.innerWidth / 2),
    Math.cos(tick / 1000) * (window.innerWidth / 2 * 0.8) + (window.innerHeight / 2),
    50
  );
  circle.endFill();
  stage.addChild(circle);
}

function drawStar(tick: number) {
  const star = new PIXI.Graphics();
  star.beginFill(0xf1c40f);
  star.drawPolygon([
    250, 100,  270, 150,
    330, 155,  285, 195,
    300, 250,  250, 220,
    200, 250,  215, 195,
    170, 155,  230, 150
  ]);
  star.setTransform(100, 200, 1, 1, Math.sin(tick / 1000))
  star.endFill();
  stage.addChild(star);
}

function drawRect(tick: number) {
  const rect = new PIXI.Graphics();
  rect.beginFill(0x0000FF);
  rect.lineStyle(25, 0x00FF00);
  rect.drawRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100);
  rect.scale.x = Math.abs(Math.sin(tick / 1000));
  rect.scale.y = Math.abs(Math.sin(tick / 1000));
  rect.endFill();
  stage.addChild(rect);
}

start(document.body);
`;

export const css = `
html, body {
  margin: 0;
  padding: 0;
}
`;

export const dependencies = {
  preact: 'https://cdnjs.cloudflare.com/ajax/libs/preact/7.2.1/preact.min',
  'pixi.js': 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.4.3/pixi.min',
  'three.js': 'https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.min'
};

export const definitions = {
  'node.d.ts': 'https://unpkg.com/@types/node/index.d.ts',
  'preact.d.ts': 'https://unpkg.com/preact/src/preact.d.ts',
  'three.d.ts': 'https://unpkg.com/@types/three/index.d.ts',
  'detector.d.ts': 'https://unpkg.com/@types/three/detector.d.ts',
  'three-FirstPersonControls.d.ts':
    'https://unpkg.com/@types/three@0.84.3/three-FirstPersonControls.d.ts',
  'three-canvasrenderer.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-canvasrenderer.d.ts',
  'three-colladaLoader.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-colladaLoader.d.ts',
  'three-copyshader.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-copyshader.d.ts',
  'three-css3drenderer.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-css3drenderer.d.ts',
  'three-ctmloader.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-ctmloader.d.ts',
  'three-editorcontrols.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-editorcontrols.d.ts',
  'three-effectcomposer.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-effectcomposer.d.ts',
  'three-maskpass.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-maskpass.d.ts',
  'three-octree.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-octree.d.ts',
  'three-orbitcontrols.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-orbitcontrols.d.ts',
  'three-orthographictrackballcontrols.d.ts':
    'https://unpkg.com/@types/three@0.84.3/three-orthographictrackballcontrols.d.ts',
  'three-projector.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-projector.d.ts',
  'three-renderpass.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-renderpass.d.ts',
  'three-shaderpass.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-shaderpass.d.ts',
  'three-trackballcontrols.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-trackballcontrols.d.ts',
  'three-transformcontrols.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-transformcontrols.d.ts',
  'three-vrcontrols.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-vrcontrols.d.ts',
  'three-vreffect.d.ts': 'https://unpkg.com/@types/three@0.84.3/three-vreffect.d.ts',
  'pixi.js.d.ts': 'https://unpkg.com/@types/pixi.js@4.4.1/index.d.ts'
};