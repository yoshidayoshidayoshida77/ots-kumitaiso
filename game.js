// Matter.jsの基本セットアップ
const { Engine, Render, World, Bodies, Body, Events } = Matter;

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 40;
const POSE_WIDTH = 40;
const POSE_HEIGHT = 80;
const PLATFORM_WIDTH = 200;
const PLATFORM_HEIGHT = 20;

let engine = Engine.create();
let world = engine.world;

let render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: '#87CEEB'
    }
});

// 土台
const platform = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - GROUND_HEIGHT - PLATFORM_HEIGHT / 2,
    PLATFORM_WIDTH,
    PLATFORM_HEIGHT,
    { isStatic: true, render: { fillStyle: '#444' } }
);
// 地面
const ground = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - GROUND_HEIGHT / 2,
    CANVAS_WIDTH,
    GROUND_HEIGHT,
    { isStatic: true, render: { fillStyle: '#228B22' } }
);
// 壁
const leftWall = Bodies.rectangle(0, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, { isStatic: true });
const rightWall = Bodies.rectangle(CANVAS_WIDTH, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, { isStatic: true });

World.add(world, [platform, ground, leftWall, rightWall]);

let activeBody = null;
let stackedCount = 0;
let isGameOver = false;

function spawnPose() {
    activeBody = Bodies.rectangle(
        CANVAS_WIDTH / 2,
        60,
        POSE_WIDTH,
        POSE_HEIGHT,
        {
            restitution: 0,
            friction: 0.5,
            render: { fillStyle: '#fff' }
        }
    );
    World.add(world, activeBody);
}

function checkGameOver() {
    if (!activeBody) return;
    // 土台から落ちたらゲームオーバー
    if (activeBody.position.y > CANVAS_HEIGHT - GROUND_HEIGHT - 10) {
        isGameOver = true;
        alert('ゲームオーバー！');
        location.reload();
    }
    // 画面上部まで到達したらクリア
    if (activeBody.position.y < 60) {
        isGameOver = true;
        alert('組体操完成！');
        location.reload();
    }
}

function freezeBody(body) {
    Body.setStatic(body, true);
    activeBody = null;
    stackedCount++;
    spawnPose();
}

// キー操作
const controlState = { left: false, right: false };
document.addEventListener('keydown', e => {
    if (!activeBody || isGameOver) return;
    if (e.code === 'ArrowLeft') controlState.left = true;
    if (e.code === 'ArrowRight') controlState.right = true;
    if (e.code === 'Space') {
        Body.setAngle(activeBody, activeBody.angle + Math.PI / 2);
        Body.setAngularVelocity(activeBody, 0);
    }
});
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') controlState.left = false;
    if (e.code === 'ArrowRight') controlState.right = false;
});

// ゲームループ
Events.on(engine, 'beforeUpdate', () => {
    if (activeBody && !isGameOver) {
        let vx = 0;
        if (controlState.left) vx = -5;
        if (controlState.right) vx = 5;
        Body.setVelocity(activeBody, { x: vx, y: activeBody.velocity.y });
    }
});

// 着地判定
Events.on(engine, 'collisionStart', event => {
    if (!activeBody || isGameOver) return;
    for (let pair of event.pairs) {
        if (pair.bodyA === activeBody && (pair.bodyB === platform || pair.bodyB.isStatic && pair.bodyB !== leftWall && pair.bodyB !== rightWall)) {
            freezeBody(activeBody);
        }
        if (pair.bodyB === activeBody && (pair.bodyA === platform || pair.bodyA.isStatic && pair.bodyA !== leftWall && pair.bodyA !== rightWall)) {
            freezeBody(activeBody);
        }
    }
});

// ゲームオーバー判定ループ
(function gameLoop() {
    if (!isGameOver) checkGameOver();
    requestAnimationFrame(gameLoop);
})();

Engine.run(engine);
Render.run(render);
spawnPose();
