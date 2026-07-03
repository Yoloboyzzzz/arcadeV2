// script.js - Version 1.6.0

// --- DOM Elements ---
const screens = {
    initial: document.getElementById('initialScreen'),
    loading: document.getElementById('loadingScreen'),
    game: document.getElementById('gameScreen'),
};

const playerNameInput = document.getElementById('playerName');
// const gameThemeSelect = document.getElementById('gameTheme'); // Replaced by radio buttons
const themeSelectorRadios = document.querySelectorAll('input[name="gameTheme"]');
const paddleSpeedSlider = document.getElementById('paddleSpeed');
const paddleSpeedValueDisplay = document.getElementById('paddleSpeedValue');
const ballSpeedSlider = document.getElementById('ballSpeed');
const ballSpeedValueDisplay = document.getElementById('ballSpeedValue');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const startGameBtn = document.getElementById('startGameBtn');
const creditsBtn = document.getElementById('creditsBtn'); // New
const closeCreditsBtn = document.getElementById('closeCreditsBtn'); // New

const loadingStepsList = document.getElementById('loadingSteps');

const hudPlayerName = document.getElementById('hudPlayerName');
const hudScore = document.getElementById('hudScore');
const hudLevel = document.getElementById('hudLevel');
const hudLives = document.getElementById('hudLives');
const hudGameSpeed = document.getElementById('hudGameSpeed');
const hudSoundStatus = document.getElementById('hudSoundStatus'); // New
const powerUpStatusBar = document.getElementById('powerUpStatusBar');
const gameCanvasContainer = document.getElementById('gameCanvasContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameScreenControls = {
    pauseResumeGameBtn: document.getElementById('pauseResumeGameBtn'),
    resetGameBtn: document.getElementById('resetGameBtn'),
    backToMenuBtn: document.getElementById('backToMenuBtn'),
};
let powerUpLegendList;

const overlays = {
    paused: document.getElementById('pausedOverlay'),
    gameOver: document.getElementById('gameOverOverlay'),
    levelComplete: document.getElementById('levelCompleteOverlay'),
    gameStartPrompt: document.getElementById('gameStartPromptOverlay'),
    credits: document.getElementById('creditsOverlay'), // New
};
const finalScoreDisplay = document.getElementById('finalScore');
const levelCompleteScoreDisplay = document.getElementById('levelCompleteScore');
const restartGameFromGameOverBtn = document.getElementById('restartGameFromGameOverBtn');
const menuFromGameOverBtn = document.getElementById('menuFromGameOverBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const promptLevelDisplay = document.getElementById('promptLevel');

let announcementElement;
let announcementTextElement;
let announcementTimeout;

const debugConsole = document.getElementById('debugConsole');
const toggleDebugVisibilityBtn = document.getElementById('toggleDebugVisibilityBtn');
const debugFpsDisplay = document.getElementById('debugFps');
const debugBallsDisplay = document.getElementById('debugBalls');
const debugPowerUpsDisplay = document.getElementById('debugPowerUps');
const debugBulletsDisplay = document.getElementById('debugBullets');
const debugLogArea = document.getElementById('debugLog');
const resetGameDebugBtn = document.getElementById('resetGameDebugBtn');
const clearLogBtn = document.getElementById('clearLogBtn');

// --- Game State & Settings ---
const GAME_VERSION = "1.6.0"; // Updated

let gameState = {
    playerName: 'Player1',
    score: 0,
    level: 1,
    lives: 3,
    currentSpeedMultiplier: 1.0,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false,
    isGameRunning: false,
    ballLaunched: false,
    soundEnabled: true, // Default to ON
    activePowerUps: [],
    nextLifeScoreThreshold: 250,
    audioInitialized: false, // For Tone.js start
};

let gameSettings = {
    basePaddleSpeed: 10,
    baseBallSpeed: 5,
    theme: 'modern',
    canvasAspectRatio: 4 / 3,
    brickRowCount: 5,
    brickColumnCount: 9,
    brickWidth: 0,
    brickHeight: 20,
    brickPadding: 5,
    brickOffsetTop: 30,
    brickOffsetLeft: 30,
    paddleHeight: 15,
    paddleWidth: 100,
    ballRadius: 8,
    maxLevels: 15,
    pointsPerExtraLife: 250,
    levelSpeedIncrement: 0.3, // Adjusted
};

// --- Game Objects ---
let paddle = {};
let balls = [];
let bricks = [];
let bullets = [];
let powerUpDrops = [];

// --- Control State ---
let rightPressed = false;
let leftPressed = false;

// --- Timing & Animation ---
let lastTime = 0;
let deltaTime = 0;
let fps = 0;
let frameCount = 0;
let fpsLastUpdate = 0;
let animationFrameId;
let resizeTimeout;

// --- Audio (Tone.js) ---
let sounds = {};
let music;
const masterVolume = new Tone.Volume(-10).toDestination(); // Master volume for all game sounds

/**
 * Initializes all audio components.
 * Must be called after a user interaction.
 */
async function initAudio() {
    if (gameState.audioInitialized) return;
    try {
        await Tone.start();
        logDebug(LOG_CATEGORIES.AUDIO, "AudioContext started successfully.");

        // Sound Effects
        sounds.paddleHit = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 },
            volume: -12
        }).connect(masterVolume);

        sounds.wallHit = new Tone.MembraneSynth({
            pitchDecay: 0.01, octaves: 2,
            envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.1 },
            volume: -15
        }).connect(masterVolume);

        sounds.brickHit = new Tone.PluckSynth({
            attackNoise: 0.5, dampening: 2000, resonance: 0.8,
            release: 0.5, volume: -10
        }).connect(masterVolume);

        sounds.brickBreak = new Tone.MetalSynth({
            frequency: 100, envelope: { attack: 0.01, decay: 0.2, release: 0.1 },
            harmonicity: 3.1, modulationIndex: 16, resonance: 1500, octaves: 1,
            volume: -8
        }).connect(masterVolume);

        sounds.powerUpSpawn = new Tone.Synth({
            oscillator: { type: "triangle8" },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.2 },
            volume: -10
        }).connect(masterVolume);
        
        sounds.powerUpCollect = new Tone.FMSynth({
            harmonicity: 1.5, modulationIndex: 5,
            envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
            volume: -8
        }).connect(masterVolume);

        sounds.lifeLost = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.2 },
            volume: -10
        }).connect(masterVolume);

        sounds.gameOver = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.1, decay: 1.0, sustain: 0, release: 0.5 },
            volume: -5
        }).connect(masterVolume);

        sounds.levelComplete = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 0.5 },
            volume: -8
        }).connect(masterVolume);

        // Background Music Loop
        music = new Tone.Loop(time => {
            const synth = new Tone.Synth({
                oscillator: { type: "pwm", modulationFrequency: 0.2 },
                envelope: { attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.5 },
                volume: -25 // Quieter for background
            }).connect(masterVolume);
            const notes = ["C3", "E3", "G3", "C4", "G3", "E3"];
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            synth.triggerAttackRelease(randomNote, "8n", time);
            // Dispose synth after use to avoid memory leaks in long sessions
            setTimeout(() => synth.dispose(), 1000);
        }, "2n"); // Loop every 2 measures (adjust timing as needed)

        Tone.Transport.bpm.value = 100; // Adjust BPM for music

        gameState.audioInitialized = true;
        logDebug(LOG_CATEGORIES.AUDIO, "Tone.js sounds and music initialized.");
        updateSoundStatusDisplay(); // Update HUD
        if (gameState.soundEnabled) {
            Tone.Transport.start();
            music.start(0);
        }

    } catch (error) {
        logDebug(LOG_CATEGORIES.ERROR, "Failed to initialize Tone.js audio", error);
        gameState.soundEnabled = false; // Disable sound if init fails
        updateSoundStatusDisplay();
    }
}

/** Plays a sound if sound is enabled and initialized */
function playSound(soundName, note = null, duration = null, time = null) {
    if (gameState.soundEnabled && gameState.audioInitialized && sounds[soundName]) {
        try {
            if (note) {
                if (duration && time) sounds[soundName].triggerAttackRelease(note, duration, time);
                else if (duration) sounds[soundName].triggerAttackRelease(note, duration);
                else sounds[soundName].triggerAttack(note);
            } else {
                 if (sounds[soundName].triggerAttackRelease) { // For synths
                    sounds[soundName].triggerAttackRelease(sounds[soundName].frequency ? sounds[soundName].frequency.value : 'C4', "8n");
                 } else if (sounds[soundName].triggerAttack) { // For simpler synths or specific triggers
                    sounds[soundName].triggerAttack();
                 }
            }
        } catch (error) {
            logDebug(LOG_CATEGORIES.ERROR, `Error playing sound: ${soundName}`, error);
        }
    }
}

function toggleSound() {
    if (!gameState.audioInitialized) { // Try to init audio on first toggle if not already done
        initAudio().then(() => {
            if(gameState.audioInitialized) { // If init was successful
                 gameState.soundEnabled = !gameState.soundEnabled;
                 if (gameState.soundEnabled) {
                    Tone.Transport.start();
                    if (music && music.state !== "started") music.start(0);
                 } else {
                    if (music && music.state === "started") music.stop();
                    // Tone.Transport.stop(); // Optional: stop transport if no other timed events
                 }
                 updateSoundStatusDisplay();
                 logDebug(LOG_CATEGORIES.AUDIO, `Sound ${gameState.soundEnabled ? 'enabled' : 'disabled'}`);
            }
        });
    } else {
        gameState.soundEnabled = !gameState.soundEnabled;
        if (gameState.soundEnabled) {
            Tone.Transport.start(); // Ensure transport is running for music/loops
            if (music && music.state !== "started") music.start(0);
        } else {
            if (music && music.state === "started") music.stop();
            // Tone.Transport.stop(); // Optional
        }
        updateSoundStatusDisplay();
        logDebug(LOG_CATEGORIES.AUDIO, `Sound ${gameState.soundEnabled ? 'enabled' : 'disabled'}`);
    }
}


function updateSoundStatusDisplay() {
    if (hudSoundStatus) {
        hudSoundStatus.textContent = gameState.soundEnabled ? 'ON' : 'OFF';
        hudSoundStatus.classList.toggle('sound-off', !gameState.soundEnabled);
    }
}


// --- Debug Logger ---
const LOG_CATEGORIES = {
    GAME: 'GAME', UI: 'UI', ERROR: 'ERROR', COLLISION: 'COLLISION',
    POWERUP: 'POWERUP', SYSTEM: 'SYSTEM', INPUT: 'INPUT', TOUCH: 'TOUCH', AUDIO: 'AUDIO'
};

function logDebug(category, message, data = null) {
    if (!debugConsole && category !== LOG_CATEGORIES.ERROR) return;

    if ((debugConsole && !debugConsole.classList.contains('hidden')) || category === LOG_CATEGORIES.ERROR) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.classList.add('log-entry');
        let content = `<span class="timestamp">[${timestamp}]</span> <span class="category category-${category.toLowerCase()}">[${category}]</span> ${message}`;
        if (data !== null) content += ` <span class="log-data">(${JSON.stringify(data)})</span>`;
        entry.innerHTML = content;
        if (debugLogArea) {
            debugLogArea.appendChild(entry);
            debugLogArea.scrollTop = debugLogArea.scrollHeight;
        }
    }
    if (category === LOG_CATEGORIES.ERROR) console.error(`[${GAME_VERSION}][${category}] ${message}`, data ?? '');
    else console.log(`[${GAME_VERSION}][${category}] ${message}`, data ?? '');
}

// --- Game Announcement Function ---
function showGameAnnouncement(message, type = 'powerup', duration = 2200) {
    if (!announcementElement || !announcementTextElement) {
        announcementElement = document.getElementById('gameAnnouncement');
        announcementTextElement = document.getElementById('announcementText');
        if (!announcementElement || !announcementTextElement) {
            logDebug(LOG_CATEGORIES.ERROR, "Announcement HTML elements not found!");
            return;
        }
    }
    logDebug(LOG_CATEGORIES.UI, `Showing announcement: ${message}`, { type });
    announcementTextElement.textContent = message;
    announcementElement.dataset.type = type;
    if (announcementTimeout) clearTimeout(announcementTimeout);
    announcementElement.classList.add('show');
    announcementTimeout = setTimeout(() => announcementElement.classList.remove('show'), duration);
}


// --- Utility Functions ---
function switchScreen(screenToShow) {
    logDebug(LOG_CATEGORIES.UI, `Switching screen to: ${screenToShow}`);
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    if (screens[screenToShow]) screens[screenToShow].classList.add('active');
    else logDebug(LOG_CATEGORIES.ERROR, `Screen not found: ${screenToShow}`);
    gameState.isGameRunning = (screenToShow === 'game');

    // Hide all overlays when switching screens, except if going to game screen
    // and specific overlays like gameStartPrompt should be active.
    if (screenToShow !== 'game') {
        Object.values(overlays).forEach(overlay => overlay.classList.remove('active'));
    }
}

function updateOverlayVisibility() {
    overlays.paused.classList.toggle('active', gameState.isPaused && !gameState.isGameOver && !gameState.isLevelComplete && gameState.isGameRunning);
    overlays.gameOver.classList.toggle('active', gameState.isGameOver);
    overlays.levelComplete.classList.toggle('active', gameState.isLevelComplete && !gameState.isGameOver);
    overlays.gameStartPrompt.classList.toggle('active', gameState.isGameRunning && !gameState.ballLaunched && !gameState.isPaused && !gameState.isGameOver && !gameState.isLevelComplete);
    // Credits overlay is handled by its own button

    if (gameState.isGameOver && finalScoreDisplay) finalScoreDisplay.textContent = gameState.score;
    if (gameState.isLevelComplete && levelCompleteScoreDisplay) levelCompleteScoreDisplay.textContent = gameState.score;
    if (gameState.isGameRunning && !gameState.ballLaunched && promptLevelDisplay) promptLevelDisplay.textContent = gameState.level;

    if (gameScreenControls.pauseResumeGameBtn) {
        gameScreenControls.pauseResumeGameBtn.textContent = gameState.isPaused ? 'Resume' : 'Pause';
        gameScreenControls.pauseResumeGameBtn.disabled = gameState.isGameOver || gameState.isLevelComplete;
    }
}

function debounce(func, delay) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(func, delay);
}

// --- Theme Management ---
function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    gameSettings.theme = themeName;
    logDebug(LOG_CATEGORIES.UI, `Theme applied: ${themeName}`);
    if (gameState.isGameRunning && bricks?.length > 0 && paddle?.color && canvas?.width > 0 && canvas?.height > 0) {
        draw();
    }
}

// --- Settings Management ---
function applyAllSettings() {
    try {
        if (playerNameInput) gameState.playerName = playerNameInput.value || 'Player1';
        if (paddleSpeedSlider) gameSettings.basePaddleSpeed = parseFloat(paddleSpeedSlider.value);
        if (ballSpeedSlider) gameSettings.baseBallSpeed = parseFloat(ballSpeedSlider.value);

        if (paddleSpeedValueDisplay && paddleSpeedSlider) paddleSpeedValueDisplay.textContent = paddleSpeedSlider.value;
        if (ballSpeedValueDisplay && ballSpeedSlider) ballSpeedValueDisplay.textContent = ballSpeedSlider.value;

        let selectedTheme = 'modern'; // Default
        themeSelectorRadios.forEach(radio => {
            if (radio.checked) selectedTheme = radio.value;
        });
        applyTheme(selectedTheme);

        if (hudPlayerName && screens.game.classList.contains('active')) {
            hudPlayerName.textContent = gameState.playerName;
        }

        if (gameState.isGameRunning) updateBallSpeeds();

        logDebug(LOG_CATEGORIES.UI, 'Settings applied', { player: gameState.playerName, paddleSpeed: gameSettings.basePaddleSpeed, ballSpeed: gameSettings.baseBallSpeed, theme: gameSettings.theme });
    } catch (error) {
        logDebug(LOG_CATEGORIES.ERROR, 'Error applying settings', error);
    }
}


// --- Canvas & Game Element Sizing ---
function resizeCanvasAndElements() {
    logDebug(LOG_CATEGORIES.SYSTEM, 'Resize event triggered');
    if (!gameCanvasContainer || !canvas) {
        logDebug(LOG_CATEGORIES.ERROR, 'Canvas container or canvas not found for resize.');
        return false;
    }
    const containerWidth = gameCanvasContainer.clientWidth;
    if (containerWidth === 0) {
        logDebug(LOG_CATEGORIES.SYSTEM, 'Resize attempt when container width is 0. Resize failed.');
        return false;
    }

    const maxContainerHeight = window.innerHeight * 0.7;
    const idealContainerHeightBasedOnWidth = containerWidth / gameSettings.canvasAspectRatio;
    const containerHeight = Math.min(maxContainerHeight, idealContainerHeightBasedOnWidth);

    let newCanvasWidth, newCanvasHeight;
    if (containerWidth / containerHeight > gameSettings.canvasAspectRatio) {
        newCanvasHeight = containerHeight;
        newCanvasWidth = newCanvasHeight * gameSettings.canvasAspectRatio;
    } else {
        newCanvasWidth = containerWidth;
        newCanvasHeight = newCanvasWidth / gameSettings.canvasAspectRatio;
    }

    canvas.width = newCanvasWidth;
    canvas.height = newCanvasHeight;
    logDebug(LOG_CATEGORIES.SYSTEM, `Canvas resized to: ${canvas.width}x${canvas.height}`);

    const oldPaddleX = paddle.x;
    paddle.width = canvas.width / 8;
    paddle.height = canvas.height / 35;
    gameSettings.paddleHeight = paddle.height;
    paddle.x = oldPaddleX !== undefined ? Math.max(0, Math.min(canvas.width - paddle.width, oldPaddleX)) : (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - paddle.height - 10;

    gameSettings.ballRadius = Math.max(5, canvas.width / 90);
    balls.forEach(ball => {
        ball.radius = gameSettings.ballRadius;
        if (gameState.ballLaunched) {
            ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
            ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
        } else {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius - 2;
        }
    });

    const currentLevelLayout = levelLayouts[(gameState.level - 1) % levelLayouts.length] || levelLayouts[0];
    const currentBrickColumnCount = currentLevelLayout[0].length;
    const currentBrickRowCount = currentLevelLayout.length;

    const totalBrickPaddingWidth = gameSettings.brickPadding * (currentBrickColumnCount + 1);
    gameSettings.brickWidth = (canvas.width - gameSettings.brickOffsetLeft * 2 - totalBrickPaddingWidth) / currentBrickColumnCount;
    const totalBrickPaddingHeight = gameSettings.brickPadding * (currentBrickRowCount + 1);
    gameSettings.brickHeight = ((canvas.height * 0.4) - gameSettings.brickOffsetTop - totalBrickPaddingHeight) / currentBrickRowCount;
    gameSettings.brickWidth = Math.max(15, gameSettings.brickWidth);
    gameSettings.brickHeight = Math.max(10, gameSettings.brickHeight);

    if (gameState.isGameRunning) {
        if (bricks?.length > 0 && bricks[0]?.length > 0) setupLevel(gameState.level, true);
        if (paddle?.color && bricks?.length > 0 && canvas.width > 0 && canvas.height > 0) draw();
    }
    return true;
}


// --- Paddle ---
function initPaddle() {
    if (canvas.width === 0 || canvas.height === 0) {
        logDebug(LOG_CATEGORIES.ERROR, "Cannot init paddle, canvas size is zero.");
        return;
    }
    paddle.width = canvas.width / 8;
    paddle.height = canvas.height / 35;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - paddle.height - 10;
    paddle.speed = gameSettings.basePaddleSpeed;
    paddle.color = 'var(--accent-primary)';
    logDebug(LOG_CATEGORIES.GAME, 'Paddle initialized', paddle);
}

function drawPaddle() {
    if (!paddle.width || !paddle.height || !ctx || !paddle.color) return;
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    const paddleColorVal = paddle.color.startsWith('var(') ? paddle.color.slice(4, -1) : paddle.color;
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(paddleColorVal).trim();
    ctx.fill();
    ctx.closePath();
}

function movePaddle() {
    const speedFactor = deltaTime / 16.67; // Normalize speed based on frame time
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed * speedFactor;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed * speedFactor;
    }
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
}

// --- Ball ---
function createBall(x, y, dx, dy, radius, color = 'var(--accent-secondary)') {
    const baseSpeed = gameSettings.baseBallSpeed * gameState.currentSpeedMultiplier;
    const magnitude = Math.sqrt(dx*dx + dy*dy);
    const finalDx = magnitude > 0 ? (dx / magnitude) * baseSpeed : 0;
    const finalDy = magnitude > 0 ? (dy / magnitude) * baseSpeed : -baseSpeed; // Default to upwards if no initial vector

    return { x, y, dx: finalDx, dy: finalDy, radius, speed: gameSettings.baseBallSpeed, color, onPaddle: !gameState.ballLaunched };
}

function initBalls() {
    if (canvas.width === 0 || canvas.height === 0) {
        logDebug(LOG_CATEGORIES.ERROR, "Cannot init balls, canvas size is zero.");
        balls = [];
        return;
    }
    balls = [];
    const newBall = createBall(paddle.x + paddle.width / 2, paddle.y - gameSettings.ballRadius -1, 0, 0, gameSettings.ballRadius);
    newBall.onPaddle = true;
    balls.push(newBall);
    gameState.ballLaunched = false;
    logDebug(LOG_CATEGORIES.GAME, 'Ball initialized on paddle', balls[0]);
}

function launchBall(ball) {
    if (ball.onPaddle) {
        logDebug(LOG_CATEGORIES.GAME, 'Launching ball');
        let launchAngleDeg = 75 + (Math.random() * 30 - 15);
        if (Math.random() < 0.5) launchAngleDeg = -launchAngleDeg;
        const launchAngleRad = launchAngleDeg * (Math.PI / 180);
        const launchSpeed = ball.speed * gameState.currentSpeedMultiplier;

        ball.dx = launchSpeed * Math.sin(launchAngleRad);
        ball.dy = -launchSpeed * Math.cos(launchAngleRad);

        if (Math.abs(ball.dx) < launchSpeed * 0.15) ball.dx = (ball.dx >= 0 ? 1 : -1) * launchSpeed * 0.15;
        if (Math.abs(ball.dy) < launchSpeed * 0.5) ball.dy = -launchSpeed * 0.5;

        const currentSpeed = Math.sqrt(ball.dx**2 + ball.dy**2);
        if (currentSpeed > 0) {
            ball.dx = (ball.dx / currentSpeed) * launchSpeed;
            ball.dy = (ball.dy / currentSpeed) * launchSpeed;
        }

        ball.onPaddle = false;
        gameState.ballLaunched = true;
        updateOverlayVisibility();
        playSound('paddleHit', 'C5', '16n'); // Sound for launching
    }
}

function drawBalls() {
    balls.forEach(ball => {
        if (!ball.radius || !ctx) return;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        const ballColorVal = ball.color.startsWith('var(') ? ball.color.slice(4, -1) : ball.color;
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(ballColorVal).trim();
        ctx.fill();
        ctx.closePath();
    });
}

function moveBalls() {
    const speedFactor = deltaTime / 16.67;
    balls.forEach((ball, index) => {
        if (ball.onPaddle) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius -1;
            return;
        }

        ball.x += ball.dx * speedFactor;
        ball.y += ball.dy * speedFactor;

        // Wall collisions
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
            ball.x = (ball.x + ball.radius > canvas.width) ? canvas.width - ball.radius : ball.radius;
            playSound('wallHit', 'A3', '32n');
        }
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
            ball.y = ball.radius;
            playSound('wallHit', 'G3', '32n');
        }

        // Paddle collision
        if (ball.dy > 0 && ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width) {
            ball.y = paddle.y - ball.radius;
            let collidePoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            let angle = collidePoint * (Math.PI / 3);
            const effectiveSpeed = ball.speed * gameState.currentSpeedMultiplier;
            ball.dx = effectiveSpeed * Math.sin(angle);
            ball.dy = -effectiveSpeed * Math.cos(angle);
            if (ball.dy >= 0) ball.dy = -Math.abs(effectiveSpeed * Math.cos(angle) || effectiveSpeed * 0.8);
            playSound('paddleHit', 'C4', '16n');
        }

        // Bottom wall / life lost
        if (ball.y - ball.radius > canvas.height) {
            balls.splice(index, 1);
            if (balls.length === 0) {
                gameState.lives--;
                if(hudLives) hudLives.textContent = gameState.lives;
                playSound('lifeLost');
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    resetBallAndPaddle();
                    gameState.ballLaunched = false;
                    updateOverlayVisibility();
                }
            }
        }
    });
}


// --- Bricks ---
const BRICK_TYPES = {
    NORMAL: { id: 1, hits: 1, score: 10, color: 'var(--accent-secondary)', hitColor: null },
    STRONG: { id: 2, hits: 2, score: 15, color: 'var(--accent-primary)', hitColor: 'var(--accent-secondary)' },
    INDESTRUCTIBLE: { id: 3, hits: Infinity, score: 0, color: 'grey' }
};

const levelLayouts = [
    [[0,1,1,1,1,1,1,1,0],[1,1,2,1,2,1,2,1,1],[1,2,1,1,1,1,1,2,1],[0,1,1,1,1,1,1,1,0]],
    [[3,1,1,1,1,1,1,1,3],[1,2,2,2,2,2,2,2,1],[1,2,0,0,0,0,0,2,1],[1,2,2,3,3,3,2,2,1],[0,1,1,1,1,1,1,1,0]],
    [[2,2,2,2,2,2,2,2,2],[2,1,1,1,1,1,1,1,2],[2,1,3,0,3,0,3,1,2],[2,1,1,1,1,1,1,1,2],[2,2,2,2,2,2,2,2,2]],
    [[0,0,1,1,3,1,1,0,0],[0,1,2,1,3,1,2,1,0],[1,2,1,2,3,2,1,2,1],[0,1,2,1,0,1,2,1,0],[0,0,1,1,1,1,1,0,0]],
    [[3,3,3,3,3,3,3,3,3],[3,1,2,1,2,1,2,1,3],[3,2,1,2,1,2,1,2,3],[3,1,2,1,2,1,2,1,3],[3,3,3,3,3,3,3,3,3]],
    [[1,1,1,1,1,1,1,1,1],[1,0,2,0,2,0,2,0,1],[1,2,0,2,0,2,0,2,1],[1,0,2,0,2,0,2,0,1],[1,1,1,1,1,1,1,1,1]],
    [[0,0,0,0,1,0,0,0,0],[0,0,0,1,2,1,0,0,0],[0,0,1,2,3,2,1,0,0],[0,1,2,3,1,3,2,1,0],[1,2,3,1,2,1,3,2,1]],
    [[1,3,1,3,1,3,1,3,1],[3,2,3,2,3,2,3,2,3],[1,3,1,3,1,3,1,3,1],[3,2,3,2,3,2,3,2,3],[1,3,1,3,1,3,1,3,1]],
    [[2,2,2,2,2,2,2,2,2],[2,0,0,0,0,0,0,0,2],[2,0,1,1,1,1,1,0,2],[2,0,0,0,0,0,0,0,2],[2,2,2,2,2,2,2,2,2]],
    [[1,1,1,1,1,1,1,1,1],[2,2,2,2,2,2,2,2,2],[3,3,3,3,3,3,3,3,3],[2,2,2,2,2,2,2,2,2],[1,1,1,1,1,1,1,1,1]],
    [[0,1,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0],[1,0,0,0,3,0,0,0,1],[0,1,0,0,0,0,0,1,0],[0,0,1,1,1,1,1,0,0]],
    [[0,0,0,0,1,0,0,0,0],[0,0,0,2,0,2,0,0,0],[0,0,1,0,3,0,1,0,0],[0,2,0,0,0,0,0,2,0],[1,0,0,0,0,0,0,0,1]],
    [[0,0,1,0,3,0,1,0,0],[0,0,1,0,2,0,1,0,0],[1,1,3,2,1,2,3,1,1],[0,0,1,0,2,0,1,0,0],[0,0,1,0,3,0,1,0,0]],
    [[0,2,0,0,2,0,0,2,0],[1,0,1,0,1,0,1,0,1],[0,0,2,0,2,0,2,0,0],[1,0,1,0,1,0,1,0,1],[0,2,0,0,2,0,0,2,0]],
    [[3,1,2,1,3,1,2,1,3],[1,2,1,2,1,2,1,2,1],[2,1,3,1,2,1,3,1,2],[1,2,1,2,1,2,1,2,1],[3,1,2,1,3,1,2,1,3]]
];

function getBrickTypeDetails(typeId) {
    for (const key in BRICK_TYPES) if (BRICK_TYPES[key].id === typeId) return JSON.parse(JSON.stringify(BRICK_TYPES[key]));
    return null;
}

function setupLevel(levelNumber, isResize = false) {
    logDebug(LOG_CATEGORIES.GAME, `Setting up level: ${levelNumber}`, {isResize});
    if (canvas.width === 0 || canvas.height === 0) {
        if (!isResize) bricks = []; return;
    }
    const layout = levelLayouts[(levelNumber - 1) % levelLayouts.length];
    if (!layout) { gameOver(); return; } // Should not happen with modulo

    gameSettings.brickRowCount = layout.length;
    gameSettings.brickColumnCount = layout[0].length;

    const totalPaddingWidth = gameSettings.brickPadding * (gameSettings.brickColumnCount -1);
    gameSettings.brickWidth = (canvas.width - 2 * gameSettings.brickOffsetLeft - totalPaddingWidth) / gameSettings.brickColumnCount;
    const totalPaddingHeight = gameSettings.brickPadding * (gameSettings.brickRowCount -1);
    gameSettings.brickHeight = ((canvas.height * 0.4) - gameSettings.brickOffsetTop - totalPaddingHeight) / gameSettings.brickRowCount;
    gameSettings.brickWidth = Math.max(20, Math.min(canvas.width / 5, gameSettings.brickWidth));
    gameSettings.brickHeight = Math.max(10, Math.min(canvas.height / 15, gameSettings.brickHeight));

    if (gameSettings.brickWidth <= 0 || gameSettings.brickHeight <= 0) {
        if (!isResize) bricks = []; return;
    }

    if (!isResize) {
        bricks = [];
        for (let r = 0; r < gameSettings.brickRowCount; r++) {
            bricks[r] = [];
            for (let c = 0; c < gameSettings.brickColumnCount; c++) {
                const brickTypeId = layout[r][c];
                if (brickTypeId > 0) {
                    const typeDetails = getBrickTypeDetails(brickTypeId);
                    bricks[r][c] = {
                        x: gameSettings.brickOffsetLeft + c * (gameSettings.brickWidth + gameSettings.brickPadding),
                        y: gameSettings.brickOffsetTop + r * (gameSettings.brickHeight + gameSettings.brickPadding),
                        width: gameSettings.brickWidth, height: gameSettings.brickHeight, status: 1,
                        type: typeDetails, currentHits: 0, displayColor: typeDetails.color
                    };
                } else bricks[r][c] = { status: 0 };
            }
        }
    } else {
        if (!bricks || bricks.length === 0 || !bricks[0]) { setupLevel(levelNumber, false); return; }
        for (let r = 0; r < gameSettings.brickRowCount; r++) {
             if (!bricks[r]) continue;
            for (let c = 0; c < gameSettings.brickColumnCount; c++) {
                if (bricks[r][c]?.status === 1) {
                    bricks[r][c].x = gameSettings.brickOffsetLeft + c * (gameSettings.brickWidth + gameSettings.brickPadding);
                    bricks[r][c].y = gameSettings.brickOffsetTop + r * (gameSettings.brickHeight + gameSettings.brickPadding);
                    bricks[r][c].width = gameSettings.brickWidth;
                    bricks[r][c].height = gameSettings.brickHeight;
                }
            }
        }
    }
}


function drawBricks() {
    if(!ctx || !bricks || bricks.length === 0) return;
    for (let r = 0; r < gameSettings.brickRowCount; r++) {
        if (!bricks[r] || bricks[r].length === 0) continue;
        for (let c = 0; c < gameSettings.brickColumnCount; c++) {
            const brick = bricks[r][c];
            if (brick?.type && brick.status === 1 && brick.width > 0 && brick.height > 0) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brick.width, brick.height);
                const brickColorVal = brick.displayColor.startsWith('var(') ? brick.displayColor.slice(4, -1) : brick.displayColor;
                ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(brickColorVal).trim();
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function checkAndAwardExtraLife() {
    if (gameState.score >= gameState.nextLifeScoreThreshold) {
        gameState.lives++;
        if(hudLives) hudLives.textContent = gameState.lives;
        showGameAnnouncement("+1 LIFE!", 'life');
        playSound('powerUpCollect', 'C6', '8n'); // Sound for extra life
        gameState.nextLifeScoreThreshold += gameSettings.pointsPerExtraLife;
    }
}

function brickCollisionDetection() {
    let activeBreakableBricksExist = false;
    for (let r = 0; r < gameSettings.brickRowCount; r++) {
        if (!bricks[r]) continue;
        for (let c = 0; c < gameSettings.brickColumnCount; c++) {
            const brick = bricks[r][c];
            if (!brick || brick.status !== 1) continue;
            if (brick.type.hits !== Infinity) activeBreakableBricksExist = true;

            balls.forEach(ball => {
                if (ball.x + ball.radius > brick.x && ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y && ball.y - ball.radius < brick.y + brick.height) {
                    
                    if (brick.type.hits === Infinity) { // Indestructible brick
                        playSound('wallHit', 'E2', '32n'); // Different sound for indestructible
                    } else {
                        brick.currentHits++;
                        gameState.score += brick.type.score;
                        if(hudScore) hudScore.textContent = gameState.score;
                        checkAndAwardExtraLife();
                        if (brick.currentHits >= brick.type.hits) {
                            brick.status = 0;
                            playSound('brickBreak', 'G4', '8n');
                            if (brick.type.hits !== Infinity) spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                        } else {
                            if (brick.type.hitColor) brick.displayColor = brick.type.hitColor;
                            playSound('brickHit', 'A4', '16n');
                        }
                    }
                    
                    const overlapX = (ball.x < brick.x + brick.width / 2) ? (ball.x + ball.radius - brick.x) : (brick.x + brick.width - (ball.x - ball.radius));
                    const overlapY = (ball.y < brick.y + brick.height / 2) ? (ball.y + ball.radius - brick.y) : (brick.y + brick.height - (ball.y - ball.radius));
                    if (overlapX < overlapY) {
                        ball.dx = -ball.dx;
                        ball.x = (ball.x < brick.x + brick.width / 2) ? brick.x - ball.radius - 0.1 : brick.x + brick.width + ball.radius + 0.1;
                    } else {
                        ball.dy = -ball.dy;
                        ball.y = (ball.y < brick.y + brick.height / 2) ? brick.y - ball.radius - 0.1 : brick.y + brick.height + ball.radius + 0.1;
                    }
                }
            });

            bullets.forEach((bullet, bulletIndex) => {
                if (brick.status === 1 && bullet.x > brick.x && bullet.x < brick.x + brick.width &&
                    bullet.y > brick.y && bullet.y < brick.y + brick.height) {
                    bullets.splice(bulletIndex, 1);
                    if (brick.type.hits !== Infinity) {
                        brick.currentHits++;
                        gameState.score += brick.type.score;
                        if(hudScore) hudScore.textContent = gameState.score;
                        checkAndAwardExtraLife();
                        if (brick.currentHits >= brick.type.hits) {
                            brick.status = 0;
                            playSound('brickBreak', 'G4', '8n');
                            spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                        } else {
                            if (brick.type.hitColor) brick.displayColor = brick.type.hitColor;
                            playSound('brickHit', 'A4', '16n');
                        }
                    }
                }
            });
        }
    }
    if (!activeBreakableBricksExist && bricks.length > 0 ) { // Removed check for non-indestructible as it was complex
         // Check if there are any breakable bricks left (status=1 and not indestructible).
        const remainingBreakable = bricks.flat().filter(b => b && b.status === 1 && b.type && b.type.hits !== Infinity);
        if (remainingBreakable.length === 0 && !gameState.isLevelComplete) {
            // Check if there are *any* bricks at all (even indestructible) to prevent premature level complete on empty custom levels
            const anyBricksAtAll = bricks.flat().some(b => b && b.status === 1);
            if(anyBricksAtAll && bricks.flat().some(b => b.type && b.type.id !== BRICK_TYPES.INDESTRUCTIBLE.id)){ // Ensure there were breakable bricks to begin with
                 levelComplete();
            } else if (!anyBricksAtAll && bricks.flat().some(b => b.type && b.type.id !== BRICK_TYPES.INDESTRUCTIBLE.id)) { // If no bricks left and there were breakable ones
                levelComplete();
            }
        }
    }
}


// --- Power-ups ---
const POWERUP_TYPES = {
    SLOW_BALL: { id: 'slow_ball', name: 'Slow Ball', duration: 10000, color: 'lightblue', effect: applySlowBall, revert: revertSlowBall, symbol: 'S' },
    PADDLE_GUN: { id: 'paddle_gun', name: 'Paddle Gun', duration: 30000, ammo: 10, color: 'lightcoral', effect: applyPaddleGun, revert: revertPaddleGun, symbol: 'G' },
    MULTI_BALL: { id: 'multi_ball', name: 'Multi Ball', duration: 0, color: 'lightgreen', effect: applyMultiBall, symbol: 'M' },
    EXTEND_PADDLE: { id: 'extend_paddle', name: 'Extend Paddle', duration: 12000, color: 'gold', effect: applyExtendPaddle, revert: revertExtendPaddle, symbol: 'E' },
    EXTRA_LIFE: { id: 'extra_life', name: 'Extra Life', duration: 0, color: 'pink', effect: applyExtraLife, symbol: '+' },
    SHRINK_PADDLE: { id: 'shrink_paddle', name: 'Shrink Paddle (Bad)', duration: 10000, color: 'darkorchid', effect: applyShrinkPaddle, revert: revertShrinkPaddle, symbol: 's' },
    FAST_BALL: { id: 'fast_ball', name: 'Fast Ball (Bad)', duration: 10000, color: 'orangered', effect: applyFastBall, revert: revertFastBall, symbol: 'F' },
};

function spawnPowerUp(x, y) {
    if (Math.random() < 0.25) { // 25% chance to spawn a power-up
        const typeKeys = Object.keys(POWERUP_TYPES);
        const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const type = POWERUP_TYPES[randomTypeKey];
        powerUpDrops.push({ x, y, radius: Math.min(gameSettings.brickWidth, gameSettings.brickHeight) / 3, type, color: type.color, symbol: type.symbol, dy: 1.5 });
        playSound('powerUpSpawn', 'E5', '8n');
    }
}

function drawPowerUpDrops() {
    if(!ctx) return;
    powerUpDrops.forEach(drop => {
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fillStyle = drop.color;
        ctx.fill();
        ctx.font = `${drop.radius * 1.2}px ${getComputedStyle(document.body).getPropertyValue('--font-accent').trim() || 'Arial'}`;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drop.symbol, drop.x, drop.y);
        ctx.closePath();
    });
}

function moveAndCollectPowerUps() {
    const speedFactor = deltaTime / 16.67;
    powerUpDrops.forEach((drop, index) => {
        drop.y += drop.dy * speedFactor;
        if (drop.x > paddle.x && drop.x < paddle.x + paddle.width &&
            drop.y + drop.radius > paddle.y && drop.y - drop.radius < paddle.y + paddle.height) {
            activatePowerUp(drop.type);
            powerUpDrops.splice(index, 1);
        } else if (drop.y - drop.radius > canvas.height) {
            powerUpDrops.splice(index, 1);
        }
    });
}

function activatePowerUp(type) {
    playSound('powerUpCollect', type.id === POWERUP_TYPES.EXTRA_LIFE.id ? 'C6' : 'A5', '8n');
    const existingPowerUpIndex = gameState.activePowerUps.findIndex(p => p.type.id === type.id);
    if (existingPowerUpIndex !== -1) {
        const existing = gameState.activePowerUps[existingPowerUpIndex];
        if (existing.type.duration > 0 && existing.duration !== Infinity) {
            existing.duration = type.duration;
            if (existing.timeoutId) clearTimeout(existing.timeoutId);
            existing.timeoutId = setTimeout(() => deactivatePowerUp(existing), existing.duration);
            if (existing.element?.querySelector('.power-up-timer')) existing.element.querySelector('.power-up-timer').dataset.expireTime = Date.now() + existing.duration;
        }
        if (existing.type.ammo !== undefined && type.ammo !== undefined && existing.ammo !== Infinity) {
             existing.ammo = (existing.ammo || 0) + type.ammo;
        }
        showGameAnnouncement(type.id === POWERUP_TYPES.EXTRA_LIFE.id ? "EXTRA LIFE!" : type.name.toUpperCase() + " REFRESHED!", type.id === POWERUP_TYPES.EXTRA_LIFE.id ? 'life' : 'powerup');
    } else {
        const activePowerUp = { type, duration: type.duration, ammo: type.ammo, element: null, timeoutId: null };
        if (type.effect) type.effect(activePowerUp);
        if (type.duration > 0 && type.duration !== Infinity) {
            activePowerUp.timeoutId = setTimeout(() => deactivatePowerUp(activePowerUp), type.duration);
        }
        if (type.duration > 0 || type.ammo !== undefined) gameState.activePowerUps.push(activePowerUp);
        showGameAnnouncement(type.id === POWERUP_TYPES.EXTRA_LIFE.id ? "EXTRA LIFE!" : type.name.toUpperCase() + "!", type.id === POWERUP_TYPES.EXTRA_LIFE.id ? 'life' : 'powerup');
    }
    updatePowerUpStatusBar();
}


function activatePermanentGun() {
    const gunPowerUpType = POWERUP_TYPES.PADDLE_GUN;
    let existingGun = gameState.activePowerUps.find(p => p.type.id === gunPowerUpType.id);

    if (existingGun) {
        existingGun.duration = Infinity;
        existingGun.ammo = Infinity;
        if(existingGun.timeoutId) clearTimeout(existingGun.timeoutId);
        existingGun.timeoutId = null;
        showGameAnnouncement("PERMANENT GUN REFRESHED!", 'powerup');
        logDebug(LOG_CATEGORIES.POWERUP, `Permanent gun refreshed.`);
    } else {
        const permanentGun = {
            type: gunPowerUpType,
            duration: Infinity,
            ammo: Infinity,
            element: null,
            timeoutId: null
        };
        if (gunPowerUpType.effect) {
            gunPowerUpType.effect(permanentGun);
        }
        gameState.activePowerUps.push(permanentGun);
        showGameAnnouncement("PERMANENT GUN ACTIVATED!", 'powerup');
        logDebug(LOG_CATEGORIES.POWERUP, `Permanent gun activated.`);
    }
    updatePowerUpStatusBar();
}


function deactivatePowerUp(powerUpToExpire) {
    if (powerUpToExpire.duration === Infinity) {
        logDebug(LOG_CATEGORIES.POWERUP, `Attempted to deactivate permanent power-up: ${powerUpToExpire.type.name}. Ignoring.`);
        return;
    }
    if (powerUpToExpire.type.revert) powerUpToExpire.type.revert(powerUpToExpire);
    gameState.activePowerUps = gameState.activePowerUps.filter(p => p !== powerUpToExpire);
    if (powerUpToExpire.timeoutId) clearTimeout(powerUpToExpire.timeoutId);
    updatePowerUpStatusBar();
}

function updatePowerUpStatusBar() {
    if(!powerUpStatusBar) return;
    powerUpStatusBar.innerHTML = '';
    gameState.activePowerUps.forEach(p => {
        const div = document.createElement('div');
        div.classList.add('power-up-active');
        div.dataset.type = p.type.id;
        let text = `<span class="power-up-name">${p.type.name}</span>`;

        if (p.type.duration > 0) {
            const displayDuration = p.duration === Infinity ? "∞" : Math.ceil(p.duration / 1000);
            const expireTimeAttr = p.duration === Infinity ? "Infinity" : Date.now() + p.duration;
            text += ` (<span class="power-up-timer" data-expire-time="${expireTimeAttr}">${displayDuration}${p.duration === Infinity ? '' : 's'}</span>)`;
        } else if (p.type.ammo !== undefined) {
            const displayAmmo = p.ammo === Infinity ? "∞" : p.ammo;
            text += ` (<span class="power-up-ammo">${displayAmmo} left</span>)`;
        }
        div.innerHTML = text;
        p.element = div;
        powerUpStatusBar.appendChild(div);
    });
    if(debugPowerUpsDisplay) debugPowerUpsDisplay.textContent = gameState.activePowerUps.length;
}

function updateActivePowerUpTimers() {
    gameState.activePowerUps.forEach(p => {
        if (p.type.duration > 0 && p.element?.querySelector('.power-up-timer')) {
            const timerSpan = p.element.querySelector('.power-up-timer');
            const expireTime = timerSpan.dataset.expireTime;

            if (expireTime === 'Infinity') {
                timerSpan.textContent = '∞';
            } else {
                const timeLeftMs = parseInt(expireTime) - Date.now();
                const timeLeftSec = Math.ceil(timeLeftMs / 1000);
                if (timeLeftSec >= 0) {
                    timerSpan.textContent = `${timeLeftSec}s`;
                } else {
                    timerSpan.textContent = '0s';
                }
            }
        }
        if (p.type.ammo !== undefined && p.element?.querySelector('.power-up-ammo')) {
            p.element.querySelector('.power-up-ammo').textContent = `${p.ammo === Infinity ? "∞" : p.ammo} left`;
        }
    });
}

function applySlowBall() { gameState.currentSpeedMultiplier *= 0.6; updateBallSpeeds(); }
function revertSlowBall() { gameState.currentSpeedMultiplier /= 0.6; updateBallSpeeds(); }
function applyFastBall() { gameState.currentSpeedMultiplier *= 1.5; updateBallSpeeds(); }
function revertFastBall() { gameState.currentSpeedMultiplier /= 1.5; updateBallSpeeds(); }

function updateBallSpeeds() {
    balls.forEach(ball => {
        const magnitude = Math.sqrt(ball.dx**2 + ball.dy**2);
        const targetSpeed = ball.speed * gameState.currentSpeedMultiplier;
        if (magnitude > 0) {
            const factor = targetSpeed / magnitude;
            ball.dx *= factor;
            ball.dy *= factor;
        }
    });
    if(hudGameSpeed) hudGameSpeed.textContent = `${gameState.currentSpeedMultiplier.toFixed(1)}x`;
}

function applyPaddleGun() {}
function revertPaddleGun() {}

function applyMultiBall() {
    if (balls.length > 0 && balls.length < 5) {
        const originalBall = balls[0];
        const launchSpeed = originalBall.speed * gameState.currentSpeedMultiplier;
        const baseAngleRad = (originalBall.onPaddle || (originalBall.dx === 0 && originalBall.dy === 0)) ? -Math.PI / 2 : Math.atan2(originalBall.dy, originalBall.dx);
        const angleOffset = Math.PI / 8;
        balls.push(createBall(originalBall.x, originalBall.y, launchSpeed * Math.cos(baseAngleRad + angleOffset), launchSpeed * Math.sin(baseAngleRad + angleOffset), originalBall.radius, originalBall.color));
        if (balls.length < 5) balls.push(createBall(originalBall.x, originalBall.y, launchSpeed * Math.cos(baseAngleRad - angleOffset), launchSpeed * Math.sin(baseAngleRad - angleOffset), originalBall.radius, originalBall.color));
        if(originalBall.onPaddle) originalBall.onPaddle = false;
        gameState.ballLaunched = true;
    }
}

function applyExtendPaddle() { paddle.width *= 1.5; if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width; }
function revertExtendPaddle() { paddle.width /= 1.5; }
function applyShrinkPaddle() { paddle.width *= 0.66; }
function revertShrinkPaddle() { paddle.width /= 0.66; }
function applyExtraLife() { gameState.lives++; if(hudLives) hudLives.textContent = gameState.lives; }

// --- Bullets ---
function fireBullet() {
    const gunPowerUp = gameState.activePowerUps.find(p => p.type.id === POWERUP_TYPES.PADDLE_GUN.id);
    if (gunPowerUp && (gunPowerUp.ammo > 0 || gunPowerUp.ammo === Infinity)) {
        bullets.push({ x: paddle.x + paddle.width / 2, y: paddle.y, width: 4, height: 10, dy: -8, color: 'yellow' });
        playSound('paddleHit', 'E5', '32n'); // Sound for firing bullet
        if (gunPowerUp.ammo !== Infinity) {
            gunPowerUp.ammo--;
            if (gunPowerUp.ammo <= 0) deactivatePowerUp(gunPowerUp);
        }
        updatePowerUpStatusBar();
    }
}

function drawBullets() {
    if(!ctx) return;
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height, bullet.width, bullet.height);
    });
    if(debugBulletsDisplay) debugBulletsDisplay.textContent = bullets.length;
}

function moveBullets() {
    const speedFactor = deltaTime / 16.67;
    bullets.forEach((bullet, index) => {
        bullet.y += bullet.dy * speedFactor;
        if (bullet.y < 0) bullets.splice(index, 1);
    });
}


// --- Game Flow & State Management ---
function resetBallAndPaddle() {
    const extend = gameState.activePowerUps.find(p => p.type.id === POWERUP_TYPES.EXTEND_PADDLE.id);
    if (extend) paddle.width /= 1.5;
    const shrink = gameState.activePowerUps.find(p => p.type.id === POWERUP_TYPES.SHRINK_PADDLE.id);
    if (shrink) paddle.width /= 0.66;
    initPaddle(); initBalls(); gameState.ballLaunched = false;
    if (extend) applyExtendPaddle(extend);
    if (shrink) applyShrinkPaddle(shrink);
    updateOverlayVisibility();
}

function resetGame(fullReset = true) {
    if (fullReset) {
        Object.assign(gameState, { score: 0, level: 1, lives: 3, nextLifeScoreThreshold: gameSettings.pointsPerExtraLife, currentSpeedMultiplier: 1.0 });
        if(hudScore) hudScore.textContent = gameState.score;
        if(hudLevel) hudLevel.textContent = gameState.level;
        if(hudLives) hudLives.textContent = gameState.lives;
    } else gameState.currentSpeedMultiplier = 1.0 + (gameState.level - 1) * gameSettings.levelSpeedIncrement;

    const powerUpsToKeep = fullReset ? [] : gameState.activePowerUps.filter(p => p.duration === Infinity);

    gameState.activePowerUps.forEach(p => {
        if (p.duration !== Infinity) {
            if (p.timeoutId) clearTimeout(p.timeoutId);
            if (p.type.revert) p.type.revert(p);
        }
    });
    gameState.activePowerUps = powerUpsToKeep;


    powerUpDrops = []; bullets = [];
    updateBallSpeeds(); updatePowerUpStatusBar(); initPaddle(); initBalls(); setupLevel(gameState.level);

    Object.assign(gameState, { isPaused: false, isGameOver: false, isLevelComplete: false, ballLaunched: false });
    gameState.isGameRunning = screens.game.classList.contains('active'); // Ensure this is set correctly
    updateOverlayVisibility();

    if (!gameState.isGameRunning && fullReset) {
        // If resetting from game over or menu, and not already in game screen, go to game screen
        // The startGameBtn click handler will call initAudio and then startGame
        // For direct calls to resetGame (like from GameOver overlay), we need to ensure startGame is called
        startGame();
    } else if (gameState.isGameRunning) { // If already in game screen (e.g. reset button during play)
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        lastTime = performance.now(); frameCount = 0; fpsLastUpdate = lastTime;
        if (gameState.soundEnabled && music && music.state !== "started" && gameState.audioInitialized) music.start(0); // Restart music
        gameLoop();
    }
}

function togglePause() {
    if (gameState.isGameOver || gameState.isLevelComplete) return;
    gameState.isPaused = !gameState.isPaused;
    logDebug(LOG_CATEGORIES.GAME, `Game ${gameState.isPaused ? 'paused' : 'resumed'}`);
    updateOverlayVisibility();
    if (!gameState.isPaused && gameState.isGameRunning) {
        if (gameState.soundEnabled && music && music.state !== "started" && gameState.audioInitialized) music.start(0); // Resume music
        lastTime = performance.now(); gameLoop();
    } else if (gameState.isPaused && animationFrameId) {
        if (gameState.soundEnabled && music && music.state === "started" && gameState.audioInitialized) music.pause(); // Pause music
        cancelAnimationFrame(animationFrameId);
    }
}

function gameOver() {
    gameState.isGameOver = true; gameState.isGameRunning = false;
    playSound('gameOver', 'C3', '1s');
    if (music && music.state === "started" && gameState.audioInitialized) music.stop();
    updateOverlayVisibility();
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
}

function levelComplete() {
    gameState.isLevelComplete = true; gameState.isGameRunning = false;
    playSound('levelComplete', ["C4", "E4", "G4", "C5"], "2n");
    if (music && music.state === "started" && gameState.audioInitialized) music.stop(); // Stop music on level complete
    updateOverlayVisibility();
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
}

function nextLevel() {
    gameState.level++;
    if (gameState.level > gameSettings.maxLevels) {
        showGameAnnouncement("ALL LEVELS CLEARED! YOU WIN!", "life", 4000);
        // Instead of looping, let's properly end or offer a restart.
        // For now, we can just show a win message and then maybe go to game over state or menu.
        // To make it simple, let's just make it a "Game Over" type state but with a win.
        gameState.isLevelComplete = false; // Clear this
        gameState.isGameOver = true; // Use game over to show final score etc.
        // Overwrite gameOverOverlay content or create a new YouWinOverlay
        if(overlays.gameOver.querySelector('h2')) overlays.gameOver.querySelector('h2').textContent = "YOU WIN!";
        if(finalScoreDisplay) finalScoreDisplay.textContent = gameState.score;
        updateOverlayVisibility();
        if (music && music.state === "started" && gameState.audioInitialized) music.stop();
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        return;
    }
    if(hudLevel) hudLevel.textContent = gameState.level;
    gameState.currentSpeedMultiplier = 1.0 + (gameState.level - 1) * gameSettings.levelSpeedIncrement;

    const powerUpsToKeep = gameState.activePowerUps.filter(p => p.duration === Infinity);
    gameState.activePowerUps.forEach(p => {
        if (p.duration !== Infinity) {
            if (p.timeoutId) clearTimeout(p.timeoutId);
        }
    });
    gameState.activePowerUps = powerUpsToKeep;

    updateBallSpeeds(); powerUpDrops = []; bullets = [];
    initPaddle(); initBalls(); setupLevel(gameState.level);
    Object.assign(gameState, { isLevelComplete: false, isGameRunning: true, ballLaunched: false });
    updateOverlayVisibility();
    updatePowerUpStatusBar();
    if (gameState.soundEnabled && music && music.state !== "started" && gameState.audioInitialized) music.start(0); // Restart music
    lastTime = performance.now(); frameCount = 0; fpsLastUpdate = lastTime;
    gameLoop();
}

async function startGame() {
    try {
        // Ensure audio is attempted to be initialized by user interaction (startGameBtn click)
        if (!gameState.audioInitialized) await initAudio();

        switchScreen('game');
        requestAnimationFrame(() => requestAnimationFrame(async () => { // Double RAF for layout calculation
            try {
                if (!gameCanvasContainer || gameCanvasContainer.clientWidth === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for layout
                    if (!gameCanvasContainer || gameCanvasContainer.clientWidth === 0) {
                         logDebug(LOG_CATEGORIES.ERROR, "Game canvas container has no width after delay.");
                         switchScreen('initial'); return;
                    }
                }
                if (!resizeCanvasAndElements() || canvas.width === 0 || canvas.height === 0) {
                    logDebug(LOG_CATEGORIES.ERROR, "Canvas resize failed or canvas has no dimensions.");
                    switchScreen('initial'); return;
                }
                // Reset Game Over title if it was changed to "YOU WIN!"
                if(overlays.gameOver.querySelector('h2')) overlays.gameOver.querySelector('h2').textContent = "GAME OVER";

                Object.assign(gameState, { score: 0, level: 1, lives: 3, nextLifeScoreThreshold: gameSettings.pointsPerExtraLife, currentSpeedMultiplier: 1.0 + (gameState.level - 1) * gameSettings.levelSpeedIncrement, activePowerUps: [], isPaused: false, isGameOver: false, isLevelComplete: false, ballLaunched: false, isGameRunning: true });
                initPaddle(); initBalls(); setupLevel(gameState.level, false);
                applyAllSettings(); updateBallSpeeds();
                powerUpDrops = []; bullets = [];
                if(hudScore) hudScore.textContent = gameState.score;
                if(hudLevel) hudLevel.textContent = gameState.level;
                if(hudLives) hudLives.textContent = gameState.lives;
                updatePowerUpStatusBar(); populatePowerUpLegend();
                updateOverlayVisibility();
                updateSoundStatusDisplay();
                if (gameState.soundEnabled && music && music.state !== "started" && gameState.audioInitialized) {
                    Tone.Transport.start();
                    music.start(0);
                } else if (!gameState.soundEnabled && music && music.state === "started" && gameState.audioInitialized) {
                    music.stop();
                }


                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                lastTime = 0; fpsLastUpdate = performance.now(); frameCount = 0;
                announcementElement = document.getElementById('gameAnnouncement');
                announcementTextElement = document.getElementById('announcementText');
                gameLoop();
            } catch (deferredError) {
                logDebug(LOG_CATEGORIES.ERROR, 'Error in deferred startGame logic', deferredError);
                switchScreen('initial');
            }
        }));
    } catch (error) {
        logDebug(LOG_CATEGORIES.ERROR, 'Error starting game (initial phase)', error);
        switchScreen('initial');
    }
}

// --- Main Game Loop ---
function update(dt) {
    movePaddle(); moveBalls(); moveBullets(); moveAndCollectPowerUps();
    brickCollisionDetection(); updateActivePowerUpTimers();
    if(debugBallsDisplay) debugBallsDisplay.textContent = balls.length;
}

function draw() {
    if(!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle(); drawBricks(); drawBalls(); drawBullets(); drawPowerUpDrops();
}

function gameLoop(timestamp) {
    if (!gameState.isGameRunning && !gameState.isPaused) { // Allow loop to run if paused for timers
        if(animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null; return;
    }
    if (!lastTime) lastTime = timestamp || performance.now();
    deltaTime = timestamp - lastTime;
    if (deltaTime <= 0 || deltaTime > 100) deltaTime = 16.67; // Clamp delta time
    lastTime = timestamp;
    frameCount++;
    if (timestamp - fpsLastUpdate >= 1000) {
        fps = frameCount; frameCount = 0; fpsLastUpdate = timestamp;
        if(debugFpsDisplay) debugFpsDisplay.textContent = fps;
    }

    if (!gameState.isPaused && !gameState.isGameOver && !gameState.isLevelComplete) {
        update(deltaTime);
    } else if (gameState.isPaused) { // Only update timers if paused
        updateActivePowerUpTimers();
    }

    draw();

    if (!gameState.isGameOver && !gameState.isLevelComplete) {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        if(animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null;
    }
}

// --- Power-Up Legend ---
function populatePowerUpLegend() {
    if (!powerUpLegendList) powerUpLegendList = document.querySelector('#powerUpLegend ul');
    if (!powerUpLegendList) return;
    powerUpLegendList.innerHTML = '';
    for (const key in POWERUP_TYPES) {
        const type = POWERUP_TYPES[key];
        const li = document.createElement('li');
        li.innerHTML = `<span class="legend-color-box" style="background-color: ${type.color};"></span> ${type.name} (${type.symbol})`;
        powerUpLegendList.appendChild(li);
    }
}

// --- Touch Event Handlers ---
function handleCanvasTouchStart(e) {
    e.preventDefault();
    logDebug(LOG_CATEGORIES.TOUCH, 'Touch start on CANVAS', { x: e.touches[0].clientX, y: e.touches[0].clientY });
    if (!gameState.audioInitialized) initAudio(); // Attempt audio init on first touch

    if (gameState.isPaused) {
        togglePause();
        return;
    }

    if (gameState.isGameRunning && !gameState.isPaused && !gameState.isGameOver && !gameState.isLevelComplete && gameState.ballLaunched) {
        fireBullet();
    }

    if (e.touches.length > 0 && paddle.width) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const relativeX = touch.clientX - rect.left;
        let targetX = relativeX - paddle.width / 2;
        targetX = Math.max(0, Math.min(canvas.width - paddle.width, targetX));
        paddle.x = targetX;
    }
}

function handleCanvasTouchMove(e) {
    e.preventDefault();
    if (!gameState.isGameRunning || gameState.isPaused || !paddle.width || !e.touches.length) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    let targetX = relativeX - paddle.width / 2;
    targetX = Math.max(0, Math.min(canvas.width - paddle.width, targetX));
    paddle.x = targetX;
}

function handleGameStartPromptTouch(e) {
    e.preventDefault();
    logDebug(LOG_CATEGORIES.TOUCH, 'Touch on GameStartPromptOverlay');
    if (!gameState.audioInitialized) initAudio(); // Attempt audio init

    if (overlays.gameStartPrompt.classList.contains('active') && balls.length > 0 && balls.some(b => b.onPaddle)) {
        balls.forEach(ball => { if (ball.onPaddle) launchBall(ball); });
    }
}

function handlePausedOverlayTouch(e) {
    e.preventDefault();
    logDebug(LOG_CATEGORIES.TOUCH, 'Touch on PausedOverlay');
    if (!gameState.audioInitialized) initAudio(); // Attempt audio init

    if (gameState.isPaused) {
        togglePause();
    }
}


// --- Event Listeners ---
function keyDownHandler(e) {
    try {
        // Universal audio init attempt on first keydown if not already done
        if (!gameState.audioInitialized && e.key !== 'F5' && e.key !== 'F12') { // Avoid on dev tools keys
             initAudio();
        }

        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) {
            if (e.key === 'Escape') document.activeElement.blur();
            return;
        }
        const keyLower = e.key.toLowerCase();
        if (keyLower === 'right' || keyLower === 'arrowright') rightPressed = true;
        else if (keyLower === 'left' || keyLower === 'arrowleft') leftPressed = true;
        else if (keyLower === ' ' || keyLower === 'spacebar') {
            e.preventDefault();
            if (gameState.isGameRunning && !gameState.isPaused && !gameState.isGameOver && !gameState.isLevelComplete) {
                if (!gameState.ballLaunched && balls.some(b => b.onPaddle)) balls.forEach(b => { if(b.onPaddle) launchBall(b); });
                else if (gameState.ballLaunched) fireBullet();
            } else if (overlays.gameStartPrompt.classList.contains('active') && balls.some(b => b.onPaddle)) {
                balls.forEach(b => { if(b.onPaddle) launchBall(b); });
            }
        } else if (keyLower === 'p') {
            if (gameState.isGameRunning && !gameState.isGameOver && !gameState.isLevelComplete) togglePause();
        } else if (keyLower === 'g') {
            if (gameState.isGameRunning && !gameState.isPaused && !gameState.isGameOver && !gameState.isLevelComplete) {
                activatePermanentGun();
                logDebug(LOG_CATEGORIES.GAME, 'Cheat activated: Permanent Gun');
            }
        }
        else if (keyLower === 't') {
            if(debugConsole) debugConsole.classList.toggle('hidden');
        } else if (keyLower === 'r') {
            if (gameState.isGameOver) resetGame(true); // This will call startGame
            else if (gameState.isGameRunning && !gameState.isPaused) {
                if (balls.length > 0 && gameState.ballLaunched) resetBallAndPaddle();
                else if (balls.length === 0 && gameState.lives > 0) resetBallAndPaddle();
            }
        } else if (keyLower === 's') {
            if (gameState.isGameRunning && !gameState.isPaused) {
                gameState.currentSpeedMultiplier = gameState.currentSpeedMultiplier > 0.7 ? 0.5 : 1.0 + (gameState.level - 1) * gameSettings.levelSpeedIncrement;
                updateBallSpeeds();
            }
        } else if (keyLower === 'm') {
            toggleSound();
        } else if (keyLower === 'l') {
            if (gameState.isGameRunning && !gameState.isPaused) {
                gameState.lives += 5; if(hudLives) hudLives.textContent = gameState.lives;
                showGameAnnouncement("+5 LIVES!", 'life', 2500);
                playSound('powerUpCollect', 'G5', '8n');
            }
        }
    } catch (error) {
        logDebug(LOG_CATEGORIES.ERROR, 'Error in keyDownHandler', { key: e.key, error: error.message });
    }
}

function keyUpHandler(e) {
    const keyLower = e.key.toLowerCase();
    if (keyLower === 'right' || keyLower === 'arrowright') rightPressed = false;
    else if (keyLower === 'left' || keyLower === 'arrowleft') leftPressed = false;
}

function mouseMoveHandler(e) {
    if (!gameState.isGameRunning || gameState.isPaused || !paddle.width) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    let targetX = relativeX - paddle.width / 2;
    targetX = Math.max(0, Math.min(canvas.width - paddle.width, targetX));
    paddle.x = targetX;
}

function setupEventListeners() {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    if (canvas) {
        canvas.addEventListener('mousemove', mouseMoveHandler);
        canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
        canvas.addEventListener('click', () => { if (!gameState.audioInitialized) initAudio(); });
    }
    if (overlays.gameStartPrompt) {
        overlays.gameStartPrompt.addEventListener('touchstart', handleGameStartPromptTouch, { passive: false });
        overlays.gameStartPrompt.addEventListener('click', handleGameStartPromptTouch);
    }
    if (overlays.paused) {
        overlays.paused.addEventListener('touchstart', handlePausedOverlayTouch, { passive: false });
        overlays.paused.addEventListener('click', handlePausedOverlayTouch);
    }

    if (startGameBtn) startGameBtn.addEventListener('click', () => {
        if (!gameState.audioInitialized) {
            initAudio().then(() => {
                loadAndStartGame();
            });
        } else {
            loadAndStartGame();
        }
    });

    function loadAndStartGame() {
        switchScreen('loading'); let step = 0;
        const steps = loadingStepsList.querySelectorAll('li');
        const stepIndicators = loadingStepsList.querySelectorAll('li .status-indicator');
        stepIndicators.forEach(ind => ind.classList.remove('done', 'pending', 'error'));
        function processStep() {
            if (step < steps.length) {
                if (step > 0) { stepIndicators[step-1].classList.remove('pending'); stepIndicators[step-1].classList.add('done'); }
                stepIndicators[step].classList.add('pending');
                setTimeout(() => { stepIndicators[step].classList.remove('pending'); stepIndicators[step].classList.add('done'); step++; processStep(); }, 150 + Math.random() * 100);
            } else { if (steps.length > 0 && step > 0) { stepIndicators[step-1].classList.remove('pending'); stepIndicators[step-1].classList.add('done'); } startGame(); }
        }
        if (steps.length > 0) processStep(); else startGame();
    }


    if(applySettingsBtn) applySettingsBtn.addEventListener('click', applyAllSettings);
    if(paddleSpeedSlider) paddleSpeedSlider.addEventListener('input', () => { if(paddleSpeedValueDisplay) paddleSpeedValueDisplay.textContent = paddleSpeedSlider.value; });
    if(ballSpeedSlider) ballSpeedSlider.addEventListener('input', () => { if(ballSpeedValueDisplay) ballSpeedValueDisplay.textContent = ballSpeedSlider.value; });

    themeSelectorRadios.forEach(radio => {
        radio.addEventListener('change', () => applyTheme(radio.value));
    });

    if(gameScreenControls.pauseResumeGameBtn) gameScreenControls.pauseResumeGameBtn.addEventListener('click', togglePause);
    if(gameScreenControls.resetGameBtn) gameScreenControls.resetGameBtn.addEventListener('click', () => resetGame(true));
    if(gameScreenControls.backToMenuBtn) gameScreenControls.backToMenuBtn.addEventListener('click', () => {
        gameState.isGameRunning = false; if(animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null;
        if (music && music.state === "started" && gameState.audioInitialized) music.stop();
        switchScreen('initial'); if(powerUpStatusBar) powerUpStatusBar.innerHTML = ''; if(debugConsole) debugConsole.classList.add('hidden');
    });

    if(restartGameFromGameOverBtn) restartGameFromGameOverBtn.addEventListener('click', () => resetGame(true));
    if(menuFromGameOverBtn) menuFromGameOverBtn.addEventListener('click', () => {
        switchScreen('initial'); if(debugConsole) debugConsole.classList.add('hidden');
    });
    if(nextLevelBtn) nextLevelBtn.addEventListener('click', nextLevel);

    if(creditsBtn) creditsBtn.addEventListener('click', () => overlays.credits.classList.add('active'));
    if(closeCreditsBtn) closeCreditsBtn.addEventListener('click', () => overlays.credits.classList.remove('active'));


    if(toggleDebugVisibilityBtn) toggleDebugVisibilityBtn.addEventListener('click', () => { if(debugConsole) debugConsole.classList.toggle('hidden'); });
    if(resetGameDebugBtn) resetGameDebugBtn.addEventListener('click', () => resetGame(true));
    if(clearLogBtn) clearLogBtn.addEventListener('click', () => { if(debugLogArea) debugLogArea.innerHTML = ''; });

    window.addEventListener('resize', () => debounce(resizeCanvasAndElements, 250));
    document.body.addEventListener('click', () => { if (!gameState.audioInitialized) initAudio(); }, { once: true });

}

// --- Initialization ---
function init() {
    try {
        logDebug(LOG_CATEGORIES.SYSTEM, `Initializing Arkanoid Game v${GAME_VERSION}...`);
        const versionInfoEl = document.querySelector('.version-info');
        if (versionInfoEl) versionInfoEl.textContent = `v${GAME_VERSION}`;
        switchScreen('initial');
        applyAllSettings();
        setupEventListeners();
        updateSoundStatusDisplay();
        announcementElement = document.getElementById('gameAnnouncement');
        announcementTextElement = document.getElementById('announcementText');
        powerUpLegendList = document.querySelector('#powerUpLegend ul');
        if (!powerUpLegendList) logDebug(LOG_CATEGORIES.ERROR, "Power-up legend <ul> element not found on init.");
        else populatePowerUpLegend();
    } catch (error) {
        logDebug(LOG_CATEGORIES.ERROR, 'Critical error during initialization', error);
        document.body.innerHTML = `<div style="color:red;padding:20px;text-align:center;"><h2>Fatal Error</h2><p>${error.message}</p></div>`;
    }
}

init();
