import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("gameCanvas");
const canvasCtx = canvasElement.getContext("2d");
const cameraStatus = document.getElementById("camera-status");
const startBtn = document.getElementById("start-quiz-btn");
const startScreen = document.getElementById("quiz-start-screen");
const gameUI = document.getElementById("game-ui");

let faceLandmarker;
let runningMode = "VIDEO";
let lastVideoTime = -1;

// Game State
let gameState = "START"; // START, PLAYING, GAME_OVER
let bird = { x: 50, y: 250, radius: 20, velocity: 0, gravity: 0.5, jump: -8 };
let pipes = [];
let score = 0;
let frameCount = 0;
let questionActive = false;
let currentQuestion = { q: "What is 5 + 5?", a: 10, options: [8, 10, 12] };

// Initialize MediaPipe
async function initFaceSensing() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: runningMode,
            numFaces: 1
        });
        cameraStatus.textContent = "Ready";
        setupCamera();

        // Check if a quiz is required after focus
        if (localStorage.getItem('pendingQuiz') === 'true') {
            cameraStatus.textContent = "Focus Bonus Active! Pass to boost streak.";
        }
    } catch (error) {
        console.error("MediaPipe Init Error:", error);
        cameraStatus.textContent = "Error: Face Sensing Unavailable";
    }
}

async function setupCamera() {
    const constraints = { video: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
}

let headPitch = 0;
async function predictWebcam() {
    if (faceLandmarker && video.readyState === 4) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;
            const results = faceLandmarker.detectForVideo(video, startTimeMs);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // Simplified "flap" detection: check if head tilts up (pitch)
                // Landmarks for nose (1) and chin (152) or similar can be used
                const landmarks = results.faceLandmarks[0];
                const top = landmarks[10].y; // Forehead
                const bottom = landmarks[152].y; // Chin
                const middle = landmarks[1].y; // Nose

                // Sensitivity threshold for flap
                const relativePitch = (middle - top) / (bottom - top);
                if (relativePitch < 0.45) { // Threshold for "up"
                    if (gameState === "PLAYING") birdFlap();
                }
            }
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

function birdFlap() {
    bird.velocity = bird.jump;
}

// Game Logic
function updateGame() {
    if (gameState !== "PLAYING") return;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Pipe generation
    if (frameCount % 100 === 0) {
        const pipeGap = 150;
        const pipeY = Math.random() * (canvasElement.height - pipeGap - 100) + 50;
        pipes.push({ x: canvasElement.width, y: pipeY, gap: pipeGap, width: 50, passed: false });
    }

    pipes.forEach(pipe => {
        pipe.x -= 3;

        // Collision Detection
        if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width) {
            if (bird.y - bird.radius < pipe.y || bird.y + bird.radius > pipe.y + pipe.gap) {
                gameOver();
            }
        }

        if (!pipe.passed && pipe.x < bird.x) {
            pipe.passed = true;
            score++;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    if (bird.y + bird.radius > canvasElement.height || bird.y - bird.radius < 0) {
        gameOver();
    }

    frameCount++;
}

function drawGame() {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw Bird
    canvasCtx.fillStyle = "#6366f1";
    canvasCtx.beginPath();
    canvasCtx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    canvasCtx.fill();

    // Draw Pipes
    canvasCtx.fillStyle = "#10b981";
    pipes.forEach(pipe => {
        canvasCtx.fillRect(pipe.x, 0, pipe.width, pipe.y);
        canvasCtx.fillRect(pipe.x, pipe.y + pipe.gap, pipe.width, canvasElement.height - (pipe.y + pipe.gap));
    });

    // Draw Score
    canvasCtx.fillStyle = "white";
    canvasCtx.font = "24px Inter";
    canvasCtx.fillText(`Score: ${score}`, 20, 40);

    if (gameState === "GAME_OVER") {
        canvasCtx.fillStyle = "rgba(0,0,0,0.7)";
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.fillStyle = "white";
        canvasCtx.textAlign = "center";
        canvasCtx.fillText("Game Over!", canvasElement.width / 2, canvasElement.height / 2);
        canvasCtx.fillText("Final Score: " + score, canvasElement.width / 2, canvasElement.height / 2 + 40);
        canvasCtx.font = "16px Inter";
        canvasCtx.fillText("Click to Restart", canvasElement.width / 2, canvasElement.height / 2 + 80);
    }
}

function gameLoop() {
    updateGame();
    drawGame();
    window.requestAnimationFrame(gameLoop);
}

async function gameOver(reason) {
    gameState = "GAME_OVER";
    console.log("Game Over:", reason);

    try {
        const user = firebase.auth().currentUser;
        if (user) {
            const idToken = await user.getIdToken();
            await fetch('/api/quiz/result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    score: score,
                    totalQuestions: score // Simple mapping for now
                })
            });
        }
    } catch (e) {
        console.error("Error saving quiz result:", e);
    }
}

function restartGame() {
    bird = { x: 50, y: 250, radius: 20, velocity: 0, gravity: 0.5, jump: -8 };
    pipes = [];
    score = 0;
    frameCount = 0;
    gameState = "PLAYING";
}

startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameUI.style.display = "block";
    restartGame();
});

canvasElement.addEventListener("click", () => {
    if (gameState === "GAME_OVER") restartGame();
});

// Initialize
initFaceSensing();
gameLoop();
