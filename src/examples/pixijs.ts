import * as Definitions from '../definitions';

export const definitions = {
  ...Definitions.defaults,
  ...{ 'pixi.js/index.d.ts': 'https://unpkg.com/@types/pixi.js/index.d.ts' }
};

export const html = '';

export const css = `
html, body {
  margin: 0;
  padding: 0;
  background-color: #000;
}
`;

export const code = `// an example of drawing with PIXI.js
import * as PIXI from 'pixi.js';

let renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = null;

let stage: PIXI.Container = null;

let rafHandle: number = null;

function start(container) {
  renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
  resize();
  container.appendChild(renderer.view);

  stage = new PIXI.Container();
  update(0);
}

function resize () {
  renderer.view.style.width = window.innerWidth + "px";
  renderer.view.style.height = window.innerHeight + "px";
  renderer.resize(window.innerWidth, window.innerHeight);
  window.onresize = resize;
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