let timerInterval = null;
let timeLeft = 0;
let totalTime = 0;
let isRunning = false;

function initTimer(onUpdate) {
    const update = () => {
        if (timeLeft > 0) {
            timeLeft--;
            if (timeLeft === 0) {
                stop();
                if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
            } else {
                onUpdate({ timeLeft, totalTime, isRunning });
            }
        }
    };

    const start = () => {
        if (timeLeft <= 0 || isRunning) return;
        isRunning = true;
        timerInterval = setInterval(update, 1000);
        onUpdate({ timeLeft, totalTime, isRunning });
    };

    const pause = () => {
        clearInterval(timerInterval);
        isRunning = false;
        onUpdate({ timeLeft, totalTime, isRunning });
    };

    const stop = () => {
        clearInterval(timerInterval);
        isRunning = false;
        onUpdate({ timeLeft, totalTime, isRunning });
    };

    const reset = () => {
        stop();
        timeLeft = 0;
        totalTime = 0;
        onUpdate({ timeLeft, totalTime, isRunning });
    };

    const set = (seconds) => {
        timeLeft = seconds;
        totalTime = seconds;
        onUpdate({ timeLeft, totalTime, isRunning });
    };

    return { start, pause, stop, reset, set, getStatus: () => ({ isRunning, timeLeft, totalTime }) };
}

window.timerUtils = { initTimer };
