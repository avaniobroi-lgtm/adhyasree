/* =========================================================
   timer.js – Pomodoro timer + Focus Lock overlay
   ========================================================= */

let timeLeft;
let totalSessionTime;   // used for progress ring %
let timerId = null;
let isLocked = false;

// ── DOM refs ──────────────────────────────────────────────
const display = document.getElementById('display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const settingChips = document.querySelectorAll('.setting-chip');
const focusStatus = document.getElementById('focus-status');

// Focus Lock overlay refs
const lockOverlay = document.getElementById('focus-lock-overlay');
const lockDisplay = document.getElementById('lock-display');
const lockRing = document.getElementById('lock-ring');
const lockTopicLbl = document.getElementById('lock-topic-label');
const giveUpBtn = document.getElementById('lock-give-up-btn');
const escWarning = document.getElementById('escape-warning');

const RING_CIRCUMFERENCE = 515.2; // 2 * π * 82

// ── Helpers ───────────────────────────────────────────────
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    const formatted = formatTime(timeLeft);
    display.textContent = formatted;
    document.title = `${formatted} - FocusFun`;

    // Keep lock overlay display in sync
    if (lockDisplay) lockDisplay.textContent = formatted;

    // Update progress ring (fills as time decreases)
    if (lockRing && totalSessionTime) {
        const progress = timeLeft / totalSessionTime;          // 1 → 0 over session
        const offset = RING_CIRCUMFERENCE * (1 - progress); // 0 → full at end
        lockRing.style.strokeDashoffset = RING_CIRCUMFERENCE - offset;
    }
}

// ── Focus Lock ────────────────────────────────────────────
function activateLock() {
    const topic = document.getElementById('timer-input').value.trim() || 'Study Session';
    lockTopicLbl.textContent = topic;
    lockOverlay.classList.add('visible');
    isLocked = true;

    // Try fullscreen for maximum focus enforcement
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
    }
}

function deactivateLock() {
    lockOverlay.classList.remove('visible');
    isLocked = false;
    if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }
}

function flashWarning(msg) {
    escWarning.textContent = msg || '🚫 Stay focused! Switching away pauses your momentum.';
    lockOverlay.classList.remove('warning');
    // Force reflow to restart animation
    void lockOverlay.offsetWidth;
    lockOverlay.classList.add('warning');

    escWarning.classList.add('show');
    setTimeout(() => escWarning.classList.remove('show'), 2800);
}

// ── Timer core ────────────────────────────────────────────
function startTimer() {
    if (timerId) {
        // Pause
        clearInterval(timerId);
        timerId = null;
        startBtn.textContent = 'Resume Focus';
        focusStatus.style.opacity = '0';
        deactivateLock();
    } else {
        // Start / Resume
        if (!timeLeft) timeLeft = 25 * 60;
        totalSessionTime = totalSessionTime || timeLeft;

        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;
                deactivateLock();

                const topic = document.getElementById('timer-input').value || 'Unknown Study Session';
                saveSession(topic);

                localStorage.setItem('pendingQuiz', 'true');

                // Brief celebratory message in overlay before switching
                lockTopicLbl.textContent = '✅ Session Complete!';
                lockDisplay.textContent = '00:00';

                setTimeout(() => {
                    deactivateLock();
                    startBtn.textContent = 'Start Focus';
                    focusStatus.style.opacity = '0';
                    alert(`Focused session complete: ${topic}! Time for your Quest Game.`);
                    const quizTabBtn = document.querySelector('[data-tab="quiz"]');
                    if (quizTabBtn) quizTabBtn.click();
                }, 800);
            }
        }, 1000);

        startBtn.textContent = 'Pause';
        focusStatus.style.opacity = '1';
        activateLock();
    }
}

async function saveSession(topic) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const idToken = await user.getIdToken();
        const activeChip = document.querySelector('.setting-chip.active');
        const duration = parseInt(activeChip.dataset.time);

        await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ topic, duration })
        });
        console.log('Session saved successfully');
    } catch (e) {
        console.error('Error saving session:', e);
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    deactivateLock();

    const activeChip = document.querySelector('.setting-chip.active');
    totalSessionTime = parseInt(activeChip.dataset.time) * 60;
    timeLeft = totalSessionTime;

    // Reset ring to full
    if (lockRing) lockRing.style.strokeDashoffset = '0';

    updateDisplay();
    startBtn.textContent = 'Start Focus';
    focusStatus.style.opacity = '0';
}

// ── Give Up button ────────────────────────────────────────
giveUpBtn.addEventListener('click', () => {
    if (!confirm('Give up this focus session? Your time will not be saved.')) return;
    clearInterval(timerId);
    timerId = null;
    deactivateLock();
    resetTimer();
});

// ── Setting chips ─────────────────────────────────────────
settingChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // Don't allow changing setting mid-session
        if (timerId) {
            flashWarning('⏳ Finish or pause your session before changing settings!');
            return;
        }
        settingChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        totalSessionTime = parseInt(chip.dataset.time) * 60;
        timeLeft = totalSessionTime;
        if (lockRing) lockRing.style.strokeDashoffset = '0';
        resetTimer();
    });
});

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', () => {
    if (timerId) {
        if (!confirm('Reset the timer? Your current session progress will be lost.')) return;
    }
    resetTimer();
});

// ── Tab / Visibility detection (Focus Mode) ───────────────
document.addEventListener('visibilitychange', () => {
    if (document.hidden && timerId && isLocked) {
        console.log('User left the tab during focus session!');
        flashWarning('🚫 Stay focused! Come back to your session.');
    }
});

// Intercept fullscreen exit (user pressed Esc)
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && timerId && isLocked) {
        // Re-request fullscreen after a brief delay
        setTimeout(() => {
            if (timerId && isLocked) {
                document.documentElement.requestFullscreen().catch(() => { });
                flashWarning('🚫 Fullscreen exited — stay focused!');
            }
        }, 300);
    }
});

// Block keyboard shortcuts that might navigate away
document.addEventListener('keydown', (e) => {
    if (!timerId || !isLocked) return;

    // Block Alt+Tab look-alike combos and F5/refresh attempts
    if (
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && (e.key === 'w' || e.key === 'W')) ||
        (e.ctrlKey && e.key === 'F4') ||
        e.key === 'F5' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 'R'))
    ) {
        e.preventDefault();
        flashWarning('🔒 Focus Lock is active — shortcuts disabled!');
    }
});

// ── Initialize ────────────────────────────────────────────
const defaultChip = document.querySelector('.setting-chip.active');
totalSessionTime = parseInt(defaultChip.dataset.time) * 60;
timeLeft = totalSessionTime;
updateDisplay();
