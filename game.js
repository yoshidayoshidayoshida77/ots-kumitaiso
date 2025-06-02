// Matter.jsモジュールの設定
const { Engine, Render, World, Bodies, Body, Events, Mouse, MouseConstraint, Query, Bounds, Composite } = Matter;

// デバッグモード
const DEBUG = true;

// デバイスチェック
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ゲーム設定
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 60;
const WALL_THICKNESS = 60;
const PLATFORM_WIDTH = 300;
const PLATFORM_HEIGHT = 20;
const MOBILE_BUTTON_HEIGHT = 60; // モバイルボタンの高さ
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
        width: isMobile ? 45 : 90,  // モバイルの場合は50%サイズ
        height: isMobile ? 90 : 180, 
        mass: 5, 
        imagePath: './images/S__56541186_0.png',
        name: '両手上げポーズ1'
    },
    pose2: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541188_0.png',
        name: '片手上げポーズ1'
    },
    pose3: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541189_0.png',
        name: '両手上げポーズ2'
    },
    pose4: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541190_0.png',
        name: 'バンザイポーズ'
    },
    pose5: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541191_0.png',
        name: '両手広げポーズ'
    },
    pose6: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541192_0.png',
        name: 'ジャンプポーズ1'
    },
    pose7: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541193_0.png',
        name: '片手上げポーズ2'
    },
    pose8: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541194_0.png',
        name: '両手広げポーズ2'
    },
    pose9: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541195_0.png',
        name: '横向きポーズ1'
    },
    pose10: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541196_0.png',
        name: '片手上げポーズ3'
    },
    pose11: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
        mass: 5, 
        imagePath: './images/S__56541199_0.png',
        name: 'ジャンプポーズ2'
    },
    pose12: { 
        width: isMobile ? 45 : 90,
        height: isMobile ? 90 : 180,
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
        background: '#87CEEB',
        hasBounds: true
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
    CANVAS_HEIGHT - (isMobile ? 140 : 260),  // モバイルの場合はボタンの上に配置
    CANVAS_WIDTH,
    GROUND_HEIGHT,
    { 
        isStatic: true, 
        friction: 1,
        restitution: 0,
        render: { 
            fillStyle: '#2E8B57',
            visible: true,
            zIndex: 2
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
        render: { 
            fillStyle: '#2E8B57',
            zIndex: 1
        } 
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
        render: { 
            fillStyle: '#2E8B57',
            zIndex: 1
        } 
    }
);

// プラットフォームの作成
const platform = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - (isMobile ? 160 : 280),  // モバイルの場合はボタンの上に配置
    PLATFORM_WIDTH,
    PLATFORM_HEIGHT,
    { 
        isStatic: true,
        friction: 1,
        restitution: 0,
        render: { 
            fillStyle: '#4a4a4a',
            visible: true,
            zIndex: 2
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
    const platformY = CANVAS_HEIGHT - (isMobile ? 160 : 280);

    // 最も高いポーズの位置を取得
    const highestBody = bodies.reduce((highest, body) => {
        return body.position.y < highest.position.y ? body : highest;
    }, bodies[0]);

    // 画面上部に到達したかチェック（成功）
    if (highestBody.position.y < 100) {
        endGame('success');
        return;
    }

    for (let body of bodies) {
        // ポーズの境界を取得
        const bodyLeft = body.bounds.min.x;
        const bodyRight = body.bounds.max.x;
        const bodyBottom = body.bounds.max.y;
        const bodyTop = body.bounds.min.y;

        // プラットフォームの範囲外に出たかチェック
        const isOffPlatform = (bodyLeft < platformLeft || bodyRight > platformRight);

        // プラットフォームより下に落ちたかチェック
        const hasFallen = bodyBottom > platformY + PLATFORM_HEIGHT;

        // 地面より下に落ちたかチェック
        const hasFallenBelowGround = bodyBottom > CANVAS_HEIGHT - (isMobile ? 140 : 260) + GROUND_HEIGHT;

        if ((isOffPlatform && hasFallen) || hasFallenBelowGround) {
            if (DEBUG) {
                console.log('Game Over - Body position:', {
                    left: bodyLeft,
                    right: bodyRight,
                    bottom: bodyBottom,
                    top: bodyTop
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
    if (isMobile) {
        // コントロールコンテナ
        const controlsContainer = document.createElement('div');
        controlsContainer.style.position = 'fixed';
        controlsContainer.style.bottom = '0';
        controlsContainer.style.left = '0';
        controlsContainer.style.width = '100%';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.backgroundColor = '#f0f0f0';
        controlsContainer.style.display = 'grid';
        controlsContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        controlsContainer.style.gap = '10px';
        controlsContainer.style.zIndex = '1000';

        // 既存のボタンを削除
        const existingButtons = document.querySelectorAll('button');
        existingButtons.forEach(button => {
            if (button.innerHTML === '←' || button.innerHTML === '→' || 
                button.innerHTML === '回転' || button.innerHTML === '次のポーズ') {
                button.remove();
            }
        });

        // 左矢印ボタン
        const leftButton = document.createElement('button');
        leftButton.innerHTML = '←';
        leftButton.style.width = '100%';
        leftButton.style.height = '50px';
        leftButton.style.fontSize = '24px';
        leftButton.style.backgroundColor = '#e0e0e0';
        leftButton.style.border = '2px solid #ccc';
        leftButton.style.borderRadius = '8px';
        leftButton.style.color = '#333';
        leftButton.style.cursor = 'pointer';

        // 次のポーズボタン
        const nextPoseButton = document.createElement('button');
        nextPoseButton.innerHTML = '次のポーズ';
        nextPoseButton.style.width = '100%';
        nextPoseButton.style.height = '50px';
        nextPoseButton.style.fontSize = '16px';
        nextPoseButton.style.backgroundColor = '#e0e0e0';
        nextPoseButton.style.border = '2px solid #ccc';
        nextPoseButton.style.borderRadius = '8px';
        nextPoseButton.style.color = '#333';
        nextPoseButton.style.cursor = 'pointer';

        // 回転ボタン
        const rotateButton = document.createElement('button');
        rotateButton.innerHTML = '回転';
        rotateButton.style.width = '100%';
        rotateButton.style.height = '50px';
        rotateButton.style.fontSize = '16px';
        rotateButton.style.backgroundColor = '#e0e0e0';
        rotateButton.style.border = '2px solid #ccc';
        rotateButton.style.borderRadius = '8px';
        rotateButton.style.color = '#333';
        rotateButton.style.cursor = 'pointer';

        // 右矢印ボタン
        const rightButton = document.createElement('button');
        rightButton.innerHTML = '→';
        rightButton.style.width = '100%';
        rightButton.style.height = '50px';
        rightButton.style.fontSize = '24px';
        rightButton.style.backgroundColor = '#e0e0e0';
        rightButton.style.border = '2px solid #ccc';
        rightButton.style.borderRadius = '8px';
        rightButton.style.color = '#333';
        rightButton.style.cursor = 'pointer';

        // イベントリスナー
        leftButton.addEventListener('touchstart', () => { 
            controlState.left = true;
            leftButton.style.backgroundColor = '#ccc';
        });
        leftButton.addEventListener('touchend', () => { 
            controlState.left = false;
            leftButton.style.backgroundColor = '#e0e0e0';
        });

        rightButton.addEventListener('touchstart', () => { 
            controlState.right = true;
            rightButton.style.backgroundColor = '#ccc';
        });
        rightButton.addEventListener('touchend', () => { 
            controlState.right = false;
            rightButton.style.backgroundColor = '#e0e0e0';
        });

        rotateButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            rotateButton.style.backgroundColor = '#ccc';
            if (activeBody && !activeBody.isLanded) {
                const currentAngle = activeBody.angle;
                Body.setAngle(activeBody, currentAngle + Math.PI/2);
                Body.setAngularVelocity(activeBody, 0);
            }
        });
        rotateButton.addEventListener('touchend', () => {
            rotateButton.style.backgroundColor = '#e0e0e0';
        });

        nextPoseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            nextPoseButton.style.backgroundColor = '#ccc';
            if (!activeBody || activeBody.isLanded) {
                createPose();
            }
        });
        nextPoseButton.addEventListener('touchend', () => {
            nextPoseButton.style.backgroundColor = '#e0e0e0';
        });

        // ボタンをコンテナに追加
        controlsContainer.appendChild(leftButton);
        controlsContainer.appendChild(nextPoseButton);
        controlsContainer.appendChild(rotateButton);
        controlsContainer.appendChild(rightButton);
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
        }
        activeBody = null;
    }
    
    const type = getRandomPoseType();
    const pose = POSES[type];
    
    if (!loadedImages[type]) {
        console.error('Image not loaded:', type);
        return;
    }

    // 新しいポーズを生成
    const body = Bodies.rectangle(
        CANVAS_WIDTH / 2,
        50,
        pose.width,
        pose.height,
        {
            mass: 1,
            restitution: 0,
            friction: 0.5,
            frictionAir: 0.002,
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

// スワイプ説明テキストを削除
document.addEventListener('DOMContentLoaded', function() {
    const helpTexts = document.querySelectorAll('div');
    helpTexts.forEach(text => {
        if (text.textContent.includes('スワイプ') || text.textContent.includes('タップ')) {
            text.remove();
        }
    });
}); 
