// ---- JavaScript本体（game.js） ----
// Matter.jsモジュールの設定
const { Engine, Render, World, Bodies, Body, Events, Mouse, MouseConstraint } = Matter;

// ゲーム設定
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 60;
const WALL_THICKNESS = 60;
const PLATFORM_WIDTH = 300;
const PLATFORM_HEIGHT = 20;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const engine = Engine.create({
  enableSleeping: true,
  gravity: { x: 0, y: 0.15 }
});
const world = engine.world;

const render = Render.create({
  canvas: document.getElementById('game-canvas'),
  engine: engine,
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false,
    background: '#87CEEB',
    hasBounds: true
  }
});

Render.run(render);
Engine.run(engine);

const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, CANVAS_WIDTH, GROUND_HEIGHT, {
  isStatic: true,
  render: { fillStyle: '#2E8B57' }
});
const leftWall = Bodies.rectangle(0, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, {
  isStatic: true,
  render: { fillStyle: '#2E8B57' }
});
const rightWall = Bodies.rectangle(CANVAS_WIDTH, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, {
  isStatic: true,
  render: { fillStyle: '#2E8B57' }
});
const platform = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100, PLATFORM_WIDTH, PLATFORM_HEIGHT, {
  isStatic: true,
  render: { fillStyle: '#4a4a4a' }
});

World.add(world, [ground, leftWall, rightWall, platform]);

const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false }
  }
});
World.add(world, mouseConstraint);
render.mouse = mouse;

let activeBody = null;
let isPlaying = false;
let imageLoaded = false;
let poseImage = new Image();
poseImage.src = './images/S__56541186_0.png';
poseImage.onload = () => { imageLoaded = true; };

function createPose() {
  if (!isPlaying || !imageLoaded) return;

  const width = isMobile ? 45 : 90;
  const height = isMobile ? 90 : 180;

  const body = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    -100,
    width,
    height,
    {
      restitution: 0,
      friction: 0.5,
      frictionAir: 0.002,
      render: {
        sprite: {
          texture: poseImage.src,
          xScale: width / poseImage.width,
          yScale: height / poseImage.height
        }
      }
    }
  );
  activeBody = body;
  World.add(world, body);
}

function startGame() {
  document.getElementById('start-screen').style.display = 'none';
  isPlaying = true;
  createPose();
  gameLoop();
}

function gameLoop() {
  if (!isPlaying) return;

  if (activeBody && activeBody.position.y > CANVAS_HEIGHT) {
    endGame();
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  isPlaying = false;
  document.getElementById('game-over-screen').style.display = 'block';
}

document.addEventListener('keydown', function(event) {
  if (!isPlaying || !activeBody) return;
  let velocityX = 0;
  if (event.code === 'ArrowLeft') velocityX = -3;
  if (event.code === 'ArrowRight') velocityX = 3;
  Body.setVelocity(activeBody, { x: velocityX, y: activeBody.velocity.y });

  if (event.code === 'Space') {
    const angle = activeBody.angle;
    Body.setAngle(activeBody, angle + Math.PI / 2);
    Body.setAngularVelocity(activeBody, 0);
  }
});
