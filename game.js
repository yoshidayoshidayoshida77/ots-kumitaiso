// Matter.jsモジュールの設定
const { Engine, Render, World, Bodies, Body, Events, Mouse, MouseConstraint, Query, Bounds, Composite } = Matter;

// デバッグモード
const DEBUG = true;

// デバイスチェック
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ゲーム設定
const CANVAS_WIDTH = 800;  // PCの画面サイズを固定
const CANVAS_HEIGHT = 600; // PCの画面サイズを固定
const GROUND_HEIGHT = 60;
const WALL_THICKNESS = 60;
const PLATFORM_WIDTH = 300;  // プラットフォームの幅を固定
const PLATFORM_HEIGHT = 20;
const SPAWN_INTERVAL = 3000; // ミリ秒
const MAX_BODIES = 30; // 最大物体数
const PIXELS_PER_METER = 50; // 50ピクセルを1メートルとして換算
const CAMERA_OFFSET = 200; // カメラが追従を開始する高さのオフセット
const MOVE_SPEED = 3; // 移動速度
const MAX_IMPACT_VELOCITY = 0.5; // 衝突時の最大速度をさらに制限

// 画像の読み込み状態を管理
let loadedImages = {};
let totalImages = 0;
let loadedImageCount = 0;

// カメラの設定
let cameraY = 0;
let targetCameraY = 0;

// ポーズの設定（画像パスを追加）
const POSES = {
    pose1: { 
        width: 90,  // 1.5倍に拡大
        height: 180, // 1.5倍に拡大
        mass: 5, 
        imagePath: './images/S__56541186_0.png',
        name: '両手上げポーズ1'
    },
    pose2: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541188_0.png',
        name: '片手上げポーズ1'
    },
    pose3: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541189_0.png',
        name: '両手上げポーズ2'
    },
    pose4: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541190_0.png',
        name: 'バンザイポーズ'
    },
    pose5: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541191_0.png',
        name: '両手広げポーズ'
    },
    pose6: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541192_0.png',
        name: 'ジャンプポーズ1'
    },
    pose7: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541193_0.png',
        name: '片手上げポーズ2'
    },
    pose8: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541194_0.png',
        name: '両手広げポーズ2'
    },
    pose9: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541195_0.png',
        name: '横向きポーズ1'
    },
    pose10: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541196_0.png',
        name: '片手上げポーズ3'
    },
    pose11: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541199_0.png',
        name: 'ジャンプポーズ2'
    },
    pose12: { 
        width: 90, 
        height: 180, 
        mass: 5, 
        imagePath: './images/S__56541200_0.png',
        name: 'ジャンプポーズ3'
    }
};

// ゲーム状態
let gameState = {
    isPlaying: false,
    startTime: 0,
    elapsedTime: 0,
    peopleCount: 0, // 積み上げた人数
    lastSpawnTime: 0,
    spawnInterval: SPAWN_INTERVAL
};

// Matter.jsの設定
const engine = Engine.create({
    enableSleeping: true,
    gravity: { x: 0, y: 0.15 } // 重力値を0.3から0.15に減少
});
const world = engine.world;

// レンダラーの設定
const render = Render.create({
    canvas: document.getElementById('game-canvas'),
    engine: engine,
    options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: '#87CEEB'
    }
});

// 初期のビューポート設定
render.bounds = {
    min: { x: 0, y: -CANVAS_HEIGHT },
    max: { x: CANVAS_WIDTH, y: 0 }
};

// 地面と壁の作成
const ground = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - GROUND_HEIGHT / 2,
    CANVAS_WIDTH,
    GROUND_HEIGHT,
    { 
        isStatic: true, 
        friction: 1,
        restitution: 0,
        render: { 
            fillStyle: '#2E8B57',
            visible: true  // 地面を表示
        } 
    }
);

const leftWall = Bodies.rectangle(
    WALL_THICKNESS / 2,
    CANVAS_HEIGHT / 2,
    WALL_THICKNESS,
    CANVAS_HEIGHT,
    { 
        isStatic: true, 
        friction: 1,
        restitution: 0,
        render: { fillStyle: '#2E8B57' } 
    }
);

const rightWall = Bodies.rectangle(
    CANVAS_WIDTH - WALL_THICKNESS / 2,
    CANVAS_HEIGHT / 2,
    WALL_THICKNESS,
    CANVAS_HEIGHT,
    { 
        isStatic: true, 
        friction: 1,
        restitution: 0,
        render: { fillStyle: '#2E8B57' } 
    }
);

// プラットフォームの作成
const platform = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - GROUND_HEIGHT - PLATFORM_HEIGHT / 2,
    PLATFORM_WIDTH,
    PLATFORM_HEIGHT,
    { 
        isStatic: true,
        friction: 1,
        restitution: 0,
        render: { 
            fillStyle: '#4a4a4a',
            visible: true  // プラットフォームを表示
        }
    }
);

World.add(world, [ground, leftWall, rightWall, platform]);

// マウス制御の設定
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

World.add(world, mouseConstraint);
render.mouse = mouse;

// 選択中のボディを管理
let activeBody = null; // 現在操作可能なポーズ

// コントロールボタンの状態
const controlState = {
    up: false,
    down: false,
    left: false,
    right: false
};

// ゲームの初期化
function initializeGame() {
    if (DEBUG) console.log('Initializing game...');
    
    // 物理エンジンの世界に物体を追加
    World.add(world, [ground, leftWall, rightWall, platform]);
    
    // マウス制御の設定
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

    // エンジンとレンダラーの開始
    Engine.run(engine);
    Render.run(render);

    if (DEBUG) console.log('Game initialized successfully');
}

// ランダムなポーズタイプを選択
function getRandomPoseType() {
    const poseTypes = Object.keys(POSES);
    return poseTypes[Math.floor(Math.random() * poseTypes.length)];
}

// ゲーム開始
function startGame() {
    if (DEBUG) console.log('Starting game...');
    document.getElementById('start-screen').style.display = 'none';
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.lastSpawnTime = Date.now();
    gameState.peopleCount = 0;
    setupMobileControls();
    
    // 最初のポーズを生成
    if (DEBUG) console.log('Creating initial pose');
    createPose();
    
    gameLoop();
}

// カメラの更新
function updateCamera() {
    // 最も高いポーズの位置を取得
    const bodies = world.bodies.filter(body => !body.isStatic);
    if (bodies.length === 0) return;

    const highestBody = bodies.reduce((highest, body) => {
        return body.position.y < highest.position.y ? body : highest;
    }, bodies[0]);

    // 目標のカメラ位置を計算（キャンバスの中央に最も高いポーズが来るように）
    const idealCameraY = Math.max(0, -(highestBody.position.y - CANVAS_HEIGHT + CAMERA_OFFSET));

    // カメラをスムーズに移動
    targetCameraY = idealCameraY;
    cameraY += (targetCameraY - cameraY) * 0.1;

    // レンダラーのビューポートを更新
    render.bounds = {
        min: { x: 0, y: -cameraY },
        max: { x: CANVAS_WIDTH, y: CANVAS_HEIGHT - cameraY }
    };

    // 壁の高さを調整
    adjustWalls();
}

// 壁の高さを調整
function adjustWalls() {
    // 既存の壁を削除
    const walls = world.bodies.filter(body => 
        body !== ground && body !== platform && 
        body.isStatic && (body === leftWall || body === rightWall)
    );
    World.remove(world, walls);

    // 新しい壁を作成（カメラの位置に応じて十分な高さを確保）
    const wallHeight = CANVAS_HEIGHT * 3;
    const newLeftWall = Bodies.rectangle(
        WALL_THICKNESS / 2,
        -cameraY + CANVAS_HEIGHT / 2,
        WALL_THICKNESS,
        wallHeight,
        { isStatic: true, render: { fillStyle: '#2E8B57' } }
    );

    const newRightWall = Bodies.rectangle(
        CANVAS_WIDTH - WALL_THICKNESS / 2,
        -cameraY + CANVAS_HEIGHT / 2,
        WALL_THICKNESS,
        wallHeight,
        { isStatic: true, render: { fillStyle: '#2E8B57' } }
    );

    World.add(world, [newLeftWall, newRightWall]);
}

// ゲームループ
function gameLoop() {
    if (!gameState.isPlaying) return;

    // 選択中のポーズを移動
    moveSelectedBody();

    // 時間の更新
    const currentTime = Date.now();
    gameState.elapsedTime = Math.floor((currentTime - gameState.startTime) / 1000);
    document.getElementById('elapsed-time').textContent = gameState.elapsedTime;

    // 人数の表示を更新
    document.getElementById('tower-height').textContent = gameState.peopleCount;

    // ゲームオーバー判定
    checkGameOver();

    requestAnimationFrame(gameLoop);
}

// ゲームオーバー判定
function checkGameOver() {
    if (!gameState.isPlaying) return;
    
    // 着地済みのポーズのみをチェック
    const bodies = world.bodies.filter(body => !body.isStatic && body.isLanded);
    if (bodies.length === 0) return;

    // プラットフォームの範囲を取得
    const platformLeft = CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2;
    const platformRight = CANVAS_WIDTH / 2 + PLATFORM_WIDTH / 2;
    const platformY = CANVAS_HEIGHT - GROUND_HEIGHT - PLATFORM_HEIGHT;

    // 最も高いポーズの位置を取得
    const highestBody = bodies.reduce((highest, body) => {
        return body.position.y < highest.position.y ? body : highest;
    }, bodies[0]);

    // 画面上部に到達したかチェック（成功）
    if (highestBody.position.y < 100) {  // 画面上部から100pxの位置を成功ラインとする
        endGame('success');
        return;
    }

    for (let body of bodies) {
        // ポーズの境界を取得
        const bodyLeft = body.bounds.min.x;
        const bodyRight = body.bounds.max.x;
        const bodyBottom = body.bounds.max.y;

        // プラットフォームの範囲外に出たかチェック
        // ポーズの端がプラットフォームの範囲外に出たらゲームオーバー
        const isOffPlatform = (bodyLeft < platformLeft) || (bodyRight > platformRight);

        // プラットフォームより下に落ちたかチェック
        const hasFallen = bodyBottom > platformY + PLATFORM_HEIGHT;

        if (isOffPlatform && hasFallen) {
            if (DEBUG) {
                console.log('Game Over - Body bounds:', {
                    left: bodyLeft,
                    right: bodyRight,
                    bottom: bodyBottom
                });
                console.log('Platform bounds:', {
                    left: platformLeft,
                    right: platformRight,
                    y: platformY
                });
            }
            endGame('failure');
            return;
        }

        // 過度な回転の判定
        if (Math.abs(body.angle) > Math.PI * 2) {
            if (DEBUG) console.log('Game over: Body rotated too much');
            endGame('failure');
            return;
        }
    }
}

// 衝突イベントの監視
Events.on(engine, 'collisionStart', function(event) {
    if (!gameState.isPlaying) return;
    
    event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // 着地判定
        if ((bodyA === platform || bodyA === ground) && bodyB === activeBody) {
            if (!bodyB.isLanded) {
                bodyB.isLanded = true;
                gameState.peopleCount++;
                activeBody = null;
                if (DEBUG) console.log('Body landed:', bodyB.position);
            }
        } else if ((bodyB === platform || bodyB === ground) && bodyA === activeBody) {
            if (!bodyA.isLanded) {
                bodyA.isLanded = true;
                gameState.peopleCount++;
                activeBody = null;
                if (DEBUG) console.log('Body landed:', bodyA.position);
            }
        }
    });
});

// ゲーム終了
function endGame(result) {
    if (DEBUG) console.log('Game over');
    gameState.isPlaying = false;
    
    // アクティブなポーズをクリア
    activeBody = null;
    
    // モバイルコントロールを非表示
    if (isMobile) {
        const controls = document.querySelectorAll('button');
        controls.forEach(button => {
            if (button.innerHTML === '←' || button.innerHTML === '→' || 
                button.innerHTML === '回転' || button.innerHTML === '次のポーズ') {
                button.style.display = 'none';
            }
        });
    }
    
    // ゲームオーバー画面を表示
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-height').textContent = gameState.peopleCount;
    document.getElementById('final-time').textContent = gameState.elapsedTime;

    // 結果に応じてタイトルを変更
    const gameOverTitle = document.querySelector('#game-over-screen h2');
    if (gameOverTitle) {
        gameOverTitle.textContent = result === 'success' ? '組体操完成！' : '組体操失敗！';
    }

    // シェアボタンの追加
    const shareButton = document.createElement('button');
    shareButton.className = 'animal-button';
    shareButton.style.backgroundColor = '#1DA1F2';
    shareButton.style.marginTop = '10px';
    shareButton.style.marginRight = '10px';
    shareButton.textContent = 'Xでシェア';
    shareButton.onclick = () => {
        const text = `OTS組体操で${gameState.peopleCount}人の組体操を${result === 'success' ? '完成' : '挑戦'}させました！\n#OTS組体操 #OVERTHESUN`;
        const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
    };

    // もう一度遊ぶボタンの追加
    const retryButton = document.createElement('button');
    retryButton.className = 'animal-button';
    retryButton.style.backgroundColor = '#4CAF50';
    retryButton.style.marginTop = '10px';
    retryButton.textContent = 'もう一度遊ぶ';
    retryButton.onclick = restartGame;
    
    const gameOverScreen = document.getElementById('game-over-screen');
    // 既存のボタンを削除
    const existingButtons = gameOverScreen.querySelectorAll('.animal-button');
    existingButtons.forEach(button => button.remove());
    
    // 新しいボタンを追加
    gameOverScreen.appendChild(shareButton);
    gameOverScreen.appendChild(retryButton);
}

// ゲーム画面をキャプチャしてダウンロード
function captureGameScreen() {
    const canvas = document.getElementById('game-canvas');
    
    // 新しいキャンバスを作成
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = canvas.width;
    captureCanvas.height = canvas.height;
    
    const ctx = captureCanvas.getContext('2d');
    
    // 背景を描画
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);
    
    // ゲーム画面を描画
    ctx.drawImage(canvas, 0, 0);

    // タイトルを追加
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('OTS組体操', captureCanvas.width / 2, 60);

    // 記録を追加
    ctx.font = '24px Arial';
    ctx.fillText(`積み上げ人数: ${gameState.peopleCount}人  経過時間: ${gameState.elapsedTime}秒`, captureCanvas.width / 2, 100);
    
    // 画像として保存
    const image = captureCanvas.toDataURL('image/png');
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    link.download = `OTS組体操_${gameState.peopleCount}人.png`;
    link.href = image;
    
    // ダウンロードを実行
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ゲームリスタート
function restartGame() {
    if (DEBUG) console.log('Restarting game...');
    
    // 既存のポーズをすべて削除
    const bodies = world.bodies.filter(body => !body.isStatic);
    World.remove(world, bodies);
    
    // ゲーム状態をリセット
    activeBody = null;
    gameState.peopleCount = 0;
    
    // ゲームオーバー画面を非表示
    document.getElementById('game-over-screen').style.display = 'none';
    
    // モバイルコントロールを再表示
    if (isMobile) {
        const controls = document.querySelectorAll('button');
        controls.forEach(button => {
            if (button.innerHTML === '←' || button.innerHTML === '→' || 
                button.innerHTML === '回転' || button.innerHTML === '次のポーズ') {
                button.style.display = 'block';
            }
        });
    }
    
    // ゲーム開始
    startGame();
}

// 選択中のポーズを移動
function moveSelectedBody() {
    if (!activeBody || !gameState.isPlaying || activeBody.isLanded) return;

    let velocityX = 0;
    let velocityY = activeBody.velocity.y; // 現在の垂直速度を維持

    if (controlState.left) velocityX = -MOVE_SPEED;
    if (controlState.right) velocityX = MOVE_SPEED;
    if (controlState.down) velocityY = MOVE_SPEED * 2;

    Body.setVelocity(activeBody, { x: velocityX, y: velocityY });
}

// キーボードイベントの設定
document.addEventListener('keydown', function(event) {
    if (!gameState.isPlaying) return;
    
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            if (activeBody && !activeBody.isLanded) {
                // 現在の角度を取得
                const currentAngle = activeBody.angle;
                
                if (event.shiftKey) {
                    // Shift + Spaceで左に90度回転
                    Body.setAngle(activeBody, currentAngle - Math.PI/2);
                } else {
                    // Spaceで右に90度回転
                    Body.setAngle(activeBody, currentAngle + Math.PI/2);
                }
                
                // 回転後に角速度をゼロにしてスピンを防止
                Body.setAngularVelocity(activeBody, 0);
            } else if (!event.shiftKey) {
                // アクティブな体がない場合は新しいポーズを生成（Shiftキーが押されていない場合のみ）
                createPose();
            }
            break;
        case 'ArrowUp':
            controlState.up = true;
            break;
        case 'ArrowDown':
            controlState.down = true;
            break;
        case 'ArrowLeft':
            controlState.left = true;
            break;
        case 'ArrowRight':
            controlState.right = true;
            break;
    }
});

document.addEventListener('keyup', function(event) {
    if (!gameState.isPlaying) return;
    switch(event.code) {
        case 'ArrowUp':
            controlState.up = false;
            break;
        case 'ArrowDown':
            controlState.down = false;
            break;
        case 'ArrowLeft':
            controlState.left = false;
            break;
        case 'ArrowRight':
            controlState.right = false;
            break;
    }
});

// タッチ操作の設定
function setupMobileControls() {
    // モバイルデバイスの場合のみ、カスタムコントロールを設定
    if (isMobile) {
        const controlsContainer = document.createElement('div');
        controlsContainer.style.position = 'fixed';
        controlsContainer.style.bottom = '20px';
        controlsContainer.style.left = '50%';
        controlsContainer.style.transform = 'translateX(-50%)';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.gap = '20px';
        controlsContainer.style.alignItems = 'center';
        controlsContainer.style.width = '100%';
        controlsContainer.style.maxWidth = '500px';
        controlsContainer.style.justifyContent = 'space-between';
        controlsContainer.style.padding = '0 20px';

        // 左矢印ボタン
        const leftButton = document.createElement('button');
        leftButton.innerHTML = '←';
        leftButton.style.width = '60px';
        leftButton.style.height = '60px';
        leftButton.style.fontSize = '24px';
        leftButton.style.backgroundColor = '#4CAF50';
        leftButton.style.border = 'none';
        leftButton.style.borderRadius = '50%';
        leftButton.style.color = 'white';
        leftButton.style.cursor = 'pointer';

        // 回転ボタン
        const rotateButton = document.createElement('button');
        rotateButton.innerHTML = '回転';
        rotateButton.style.width = '80px';
        rotateButton.style.height = '60px';
        rotateButton.style.fontSize = '18px';
        rotateButton.style.backgroundColor = '#2196F3';
        rotateButton.style.border = 'none';
        rotateButton.style.borderRadius = '10px';
        rotateButton.style.color = 'white';
        rotateButton.style.cursor = 'pointer';
        rotateButton.style.position = 'absolute';
        rotateButton.style.left = '50%';
        rotateButton.style.transform = 'translateX(-50%)';
        rotateButton.style.bottom = '100px';

        // 右矢印ボタン
        const rightButton = document.createElement('button');
        rightButton.innerHTML = '→';
        rightButton.style.width = '60px';
        rightButton.style.height = '60px';
        rightButton.style.fontSize = '24px';
        rightButton.style.backgroundColor = '#4CAF50';
        rightButton.style.border = 'none';
        rightButton.style.borderRadius = '50%';
        rightButton.style.color = 'white';
        rightButton.style.cursor = 'pointer';

        // 次のポーズボタン
        const nextPoseButton = document.createElement('button');
        nextPoseButton.innerHTML = '次のポーズ';
        nextPoseButton.style.width = '120px';
        nextPoseButton.style.height = '60px';
        nextPoseButton.style.fontSize = '16px';
        nextPoseButton.style.backgroundColor = '#FF5722';
        nextPoseButton.style.border = 'none';
        nextPoseButton.style.borderRadius = '10px';
        nextPoseButton.style.color = 'white';
        nextPoseButton.style.cursor = 'pointer';
        nextPoseButton.style.position = 'absolute';
        nextPoseButton.style.left = '50%';
        nextPoseButton.style.transform = 'translateX(-50%)';
        nextPoseButton.style.bottom = '20px';

        // ボタンのイベントリスナー
        leftButton.addEventListener('touchstart', () => { controlState.left = true; });
        leftButton.addEventListener('touchend', () => { controlState.left = false; });

        rightButton.addEventListener('touchstart', () => { controlState.right = true; });
        rightButton.addEventListener('touchend', () => { controlState.right = false; });

        rotateButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (activeBody) {
                Body.rotate(activeBody, Math.PI / 2);
            }
        });

        nextPoseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            createPose();
        });

        controlsContainer.appendChild(leftButton);
        controlsContainer.appendChild(rightButton);
        document.body.appendChild(rotateButton);
        document.body.appendChild(nextPoseButton);
        document.body.appendChild(controlsContainer);

        // タッチイベントの無効化
        render.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        render.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        render.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
}

// 画像の読み込み
function loadImages() {
    if (DEBUG) console.log('Starting image loading...');
    totalImages = Object.keys(POSES).length;
    loadedImageCount = 0;
    loadedImages = {};
    
    Object.entries(POSES).forEach(([key, pose]) => {
        const img = new Image();
        img.onload = () => {
            loadedImages[key] = img;
            loadedImageCount++;
            console.log(`画像を読み込みました: ${pose.imagePath} (${loadedImageCount}/${totalImages})`);
            if (loadedImageCount === totalImages) {
                console.log('All images loaded successfully');
                document.getElementById('loading-screen').style.display = 'none';
                initializeGame();
            }
        };
        img.onerror = (error) => {
            console.error(`画像の読み込みに失敗しました: ${pose.imagePath}`, error);
        };
        if (DEBUG) console.log('Loading image:', pose.imagePath);
        img.src = pose.imagePath;
    });
}

// ゲーム開始時に画像を読み込む
loadImages();

// 新しいポーズの作成
function createPose() {
    if (!gameState.isPlaying) return;
    
    if (DEBUG) console.log('Creating new pose...');
    
    // 物体数をチェック
    const bodies = world.bodies.filter(body => !body.isStatic);
    if (bodies.length >= MAX_BODIES) {
        const oldBodies = bodies.slice(0, bodies.length - MAX_BODIES + 1);
        World.remove(world, oldBodies);
    }
    
    // 既存のactiveBodyがある場合は、それを着地済みとしてマーク
    if (activeBody) {
        if (!activeBody.isLanded) {
            activeBody.isLanded = true;
            gameState.peopleCount++;
            if (DEBUG) console.log('People count (from createPose):', gameState.peopleCount);
        }
        activeBody = null;
    }
    
    const type = getRandomPoseType();
    const pose = POSES[type];
    
    if (!loadedImages[type]) {
        console.error('Image not loaded:', type);
        return;
    }

    // 新しいポーズを生成（空気抵抗を若干増加）
    const body = Bodies.rectangle(
        CANVAS_WIDTH / 2,
        50,
        pose.width,
        pose.height,
        {
            mass: 1,
            restitution: 0,     // 反発なし
            friction: 0.5,      // 標準的な摩擦
            frictionAir: 0.002, // 空気抵抗を少し増加
            isLanded: false,
            render: {
                sprite: {
                    texture: pose.imagePath,
                    xScale: pose.width / loadedImages[type].width,
                    yScale: pose.height / loadedImages[type].height
                }
            }
        }
    );

    // 初期速度をゼロに設定
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);

    activeBody = body;
    World.add(world, body);
    if (DEBUG) console.log('New pose created and active');
} 
