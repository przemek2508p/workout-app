let timerInterval = null;
let timeLeft = 0;
let totalTime = 0;
let isRunning = false;

// Audio context for pleasant Apple-like beeps
let audioCtx = null;
function playBeep(frequency, duration, volume = 0.1) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio Context error:", e);
    }
}

function initTimer(onUpdate) {
    const update = () => {
        if (timeLeft > 0) {
            timeLeft--;
            
            // 10 second warning: 2 beeps (lower pitch)
            if (timeLeft === 10) {
                playBeep(440, 0.15);
                setTimeout(() => playBeep(440, 0.15), 300);
            }

            if (timeLeft === 0) {
                stop();
                // Finished: 4 beeps (mid-low pitch)
                playBeep(523, 0.2);
                setTimeout(() => playBeep(523, 0.2), 350);
                setTimeout(() => playBeep(523, 0.2), 700);
                setTimeout(() => playBeep(523, 0.2), 1050);
                
                if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200, 100, 200]);
            }
            
            onUpdate({ timeLeft, totalTime, isRunning });
        }
    };

    const start = () => {
        if (timeLeft <= 0 || isRunning) return;
        // Resume AudioContext on user interaction
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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
