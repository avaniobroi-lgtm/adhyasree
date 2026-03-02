let timeLeft;
let timerId = null;
let isWorkSession = true;

const display = document.getElementById('display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const settingChips = document.querySelectorAll('.setting-chip');
const focusStatus = document.getElementById('focus-status');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `${display.textContent} - FocusFun`;
}

function startTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
        startBtn.textContent = 'Resume Focus';
        focusStatus.style.opacity = '0';
    } else {
        if (!timeLeft) timeLeft = 25 * 60;
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;
                alert('Session complete! Ready for a quiz?');
                // Logic to trigger quiz or break
            }
        }, 1000);
        startBtn.textContent = 'Pause';
        focusStatus.style.opacity = '1';
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    const activeChip = document.querySelector('.setting-chip.active');
    timeLeft = parseInt(activeChip.dataset.time) * 60;
    updateDisplay();
    startBtn.textContent = 'Start Focus';
    focusStatus.style.opacity = '0';
}

settingChips.forEach(chip => {
    chip.addEventListener('click', () => {
        settingChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        timeLeft = parseInt(chip.dataset.time) * 60;
        resetTimer();
    });
});

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

// Tab Visibility Detection (Focus Mode)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && timerId) {
        console.log('User left the tab during focus session!');
        // Here we would send notification to backend
        alert('You left the focus tab! Your session might be invalidated.');
    }
});

// Initialize
timeLeft = 25 * 60;
updateDisplay();
