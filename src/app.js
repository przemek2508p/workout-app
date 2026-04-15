// Globals from other scripts
// workoutData, workoutStore, timerUtils

let currentWeek = 1;
let currentDay = 'A1';
let exerciseChartInstance = null;

// Setup Timer
const timer = window.timerUtils.initTimer(({ timeLeft, totalTime, isRunning }) => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-display').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    const progress = totalTime > 0 ? (timeLeft / totalTime) * 283 : 283;
    const bar = document.getElementById('timer-progress-bar');
    if (bar) bar.style.strokeDashoffset = 283 - progress;
    const actionBtn = document.getElementById('timer-action');
    if (actionBtn) {
        actionBtn.innerText = isRunning ? 'Pauza' : 'Wznów';
        if (timeLeft === 0 && !isRunning) actionBtn.innerText = 'Start';
    }
});

function init() {
    const weekDiv = document.getElementById('week-selector');
    if (weekDiv) {
        weekDiv.innerHTML = '';
        for (let i = 1; i <= 8; i++) {
            const btn = document.createElement('button');
            btn.className = `week-btn flex-shrink-0 w-11 h-11 rounded-xl border border-slate-700 flex items-center justify-center text-sm font-bold ${i === 1 ? 'active' : ''}`;
            btn.innerText = i;
            btn.id = `wk-${i}`;
            btn.onclick = () => changeWeek(i);
            weekDiv.appendChild(btn);
        }
    }
    render();
}

function changeWeek(w) {
    document.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`wk-${w}`);
    if (activeBtn) activeBtn.classList.add('active');
    currentWeek = w;
    render();
}

function changeDay(d) {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('tab-active'));
    const navBtn = document.getElementById(`nav-${d}`);
    if (navBtn) navBtn.classList.add('tab-active');

    if (d === 'KALK') {
        document.getElementById('exercise-list').classList.add('hidden');
        document.getElementById('calculator-view').classList.remove('hidden');
        document.getElementById('stats-view').classList.add('hidden');
    } else if (d === 'STATS') {
        document.getElementById('exercise-list').classList.add('hidden');
        document.getElementById('calculator-view').classList.add('hidden');
        document.getElementById('stats-view').classList.remove('hidden');
        updateStats();
    } else {
        document.getElementById('exercise-list').classList.remove('hidden');
        document.getElementById('calculator-view').classList.add('hidden');
        document.getElementById('stats-view').classList.add('hidden');
        currentDay = d;
        render();
    }
}

function save(id, field) {
    const input = document.getElementById(`${field}-${id}`);
    if (!input) return;
    const val = input.value;
    window.workoutStore.saveExercise(currentWeek, id, field, val);

    if (field === 'kg' || field === 'reps' || field === 'sets_done') {
        const kg = document.getElementById(`kg-${id}`)?.value || 0;
        const reps = document.getElementById(`reps-${id}`)?.value || 0;
        const sets = document.getElementById(`sets_done-${id}`)?.value || 0;
        const vol = window.workoutStore.calculateVolume(kg, reps, sets);
        const volEl = document.getElementById(`vol-${id}`);
        if (volEl) volEl.innerText = vol > 0 ? `${vol} kg` : '-';
        
        if (field === 'sets_done') {
            updateDots(id, val);
        }
    }
}

function markDotDone(id) {
    const dotsContainer = document.getElementById(`dots-${id}`);
    const tracker = document.getElementById(`sets-tracker-${id}`);
    if (!dotsContainer || !tracker) return;
    
    const dots = dotsContainer.querySelectorAll('.dot');
    const activeDots = Array.from(dots).filter(dot => !dot.classList.contains('opacity-20'));
    
    if (activeDots.length > 0) {
        const dot = activeDots[0];
        dot.classList.add('opacity-20', 'scale-75');
        dot.classList.remove('bg-sky-400', 'shadow-[0_0_10px_rgba(56,189,248,0.5)]');
        dot.classList.add('bg-slate-700');
        
        // If it was the last active dot, hide the tracker
        if (activeDots.length === 1) {
            setTimeout(() => tracker.classList.add('hidden'), 300);
        }
    }
}

function updateDots(id, count) {
    const dotsContainer = document.getElementById(`dots-${id}`);
    const tracker = document.getElementById(`sets-tracker-${id}`);
    if (!dotsContainer || !tracker) return;
    
    const num = parseInt(count) || 0;
    if (num <= 0) {
        tracker.classList.add('hidden');
        dotsContainer.innerHTML = '';
        return;
    }
    
    tracker.classList.remove('hidden');
    dotsContainer.innerHTML = Array.from({length: num}).map(() => `
        <div class="dot w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300"></div>
    `).join('');
}

function saveSessionNote() {
    const val = document.getElementById('session-notes-input')?.value || '';
    window.workoutStore.saveSessionNotes(currentWeek, currentDay, val);
}

function render() {
    const list = document.getElementById('exercise-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!window.workoutData[currentDay]) return;

    window.workoutData[currentDay].forEach(ex => {
        const saved = window.workoutStore.getSavedExercise(currentWeek, ex.id);
        const vol = window.workoutStore.calculateVolume(saved.kg, saved.reps, saved.sets_done);
        const isRamp = ex.sets.toLowerCase().includes('rampa');
        const totalSetsMatch = ex.sets.match(/\d+/g);
        const totalSets = totalSetsMatch ? Math.max(...totalSetsMatch.map(Number)) : 0;
        const setsDone = parseInt(saved.sets_done) || 0;

        const card = document.createElement('div');
        card.className = 'exercise-card p-5 shadow-lg';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-5 text-left">
                <div class="space-y-1">
                    <h3 class="font-black text-sky-400 text-lg leading-tight uppercase">${ex.name}</h3>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">${ex.sets} × ${ex.repsTarget}</span>
                            <span class="tempo-badge">${ex.tempo}</span>
                        </div>
                        <div id="sets-tracker-${ex.id}" class="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50 ${setsDone > 0 ? '' : 'hidden'}">
                            <div id="dots-${ex.id}" class="flex gap-1">
                                ${Array.from({length: setsDone}).map(() => `
                                    <div class="dot w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300"></div>
                                `).join('')}
                            </div>
                            <button onclick="window.app.markDotDone('${ex.id}')" class="text-sky-400 hover:text-sky-300 p-0.5 active:scale-75 transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <a href="${ex.link}" target="_blank" class="bg-sky-500/10 border border-sky-500/30 p-2.5 rounded-xl shadow-inner active:scale-90 transition">
                    <svg class="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </a>
            </div>
            
            <div class="grid grid-cols-4 gap-2 mb-3">
                <div class="flex flex-col">
                    <label class="text-[7px] font-black text-slate-500 uppercase mb-1.5 ml-1 tracking-widest text-center">SERIE</label>
                    <input type="number" id="sets_done-${ex.id}" value="${saved.sets_done || ''}" oninput="window.app.save('${ex.id}', 'sets_done')" class="input-field text-center" placeholder="-">
                </div>
                <div class="flex flex-col"><label class="text-[7px] font-black text-slate-500 uppercase mb-1.5 ml-1 tracking-widest text-center">POWT.</label><input type="number" id="reps-${ex.id}" value="${saved.reps || ''}" oninput="window.app.save('${ex.id}', 'reps')" class="input-field" placeholder="-"></div>
                <div class="flex flex-col"><label class="text-[7px] font-black text-slate-500 uppercase mb-1.5 ml-1 tracking-widest text-center">KG</label><input type="number" step="0.5" id="kg-${ex.id}" value="${saved.kg || ''}" oninput="window.app.save('${ex.id}', 'kg')" class="input-field" placeholder="-"></div>
                <div class="flex flex-col"><label class="text-[7px] font-black text-slate-500 uppercase mb-1.5 ml-1 tracking-widest text-center">RIR</label><input type="text" id="rir-${ex.id}" value="${saved.rir || ''}" oninput="window.app.save('${ex.id}', 'rir')" class="input-field" placeholder="?"></div>
            </div>

            <div class="grid ${isRamp ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4">
                <div class="flex flex-col">
                    <label class="text-[7px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest text-left">PRZERWA (S)</label>
                    <input type="number" id="rest_time-${ex.id}" value="${saved.rest_time || ''}" oninput="window.app.save('${ex.id}', 'rest_time')" class="input-field !text-left px-3 text-sky-300" placeholder="Sekundy">
                </div>
                ${isRamp ? `
                <div class="flex flex-col">
                    <label class="text-[7px] font-black text-amber-500 uppercase mb-1.5 ml-1 tracking-widest text-left">RAMP TOP (KG)</label>
                    <input type="number" step="0.5" id="ramp_top-${ex.id}" value="${saved.ramp_top || ''}" oninput="window.app.save('${ex.id}', 'ramp_top')" class="input-field !text-left px-3 border-amber-500/30 text-amber-400" placeholder="Ciężar rampy">
                </div>
                ` : ''}
            </div>

            <div class="mb-4">
                <label class="text-[7px] font-black text-slate-500 uppercase mb-1.5 ml-1 tracking-widest text-left">NOTATKI DO ĆWICZENIA</label>
                <input type="text" id="notes-${ex.id}" value="${saved.notes || ''}" oninput="window.app.save('${ex.id}', 'notes')" class="input-field !text-left px-3 text-xs font-normal italic" placeholder="np. lekko poszło, ból w łokciu...">
            </div>

            <div class="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                <p class="text-[10px] text-slate-400 italic flex-1 mr-4">● ${ex.note}</p>
                <div class="text-right flex-shrink-0">
                    <span class="text-[8px] text-slate-500 font-bold uppercase block tracking-widest">Objętość</span>
                    <span id="vol-${ex.id}" class="text-xs font-black text-sky-400">${vol > 0 ? vol + ' kg' : '-'}</span>
                </div>
            </div>
        `;
        list.appendChild(card);
    });

    // Add Session Notes at the bottom
    const sessionNotes = window.workoutStore.getSessionNotes(currentWeek, currentDay);
    const notesCard = document.createElement('div');
    notesCard.className = 'exercise-card p-6 border-dashed border-sky-500/30 bg-sky-500/5 mt-8';
    notesCard.innerHTML = `
        <h3 class="text-sky-400 font-black text-sm uppercase mb-4 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Uwagi do całego treningu
        </h3>
        <textarea id="session-notes-input" oninput="window.app.saveSessionNote()" 
            class="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:border-sky-500 outline-none min-h-[100px]" 
            placeholder="Jak się czułeś? Coś do poprawy w następnym tygodniu?">${sessionNotes}</textarea>
    `;
    list.appendChild(notesCard);
}

function calculateWeights() {
    const cm = parseFloat(document.getElementById('cm-input').value) || 0;
    const resultsDiv = document.getElementById('calc-results');
    const percs = [60, 70, 75, 80, 82, 85, 87, 90, 92, 95];
    resultsDiv.innerHTML = percs.map(p => `
        <div class="bg-slate-900 p-3 rounded-xl border border-slate-700 flex justify-between items-center shadow-inner">
            <span class="text-[10px] font-bold text-slate-500">${p}%</span>
            <span class="text-lg font-black text-white">${(Math.round((cm * (p / 100)) * 0.4) / 0.4).toFixed(1)}<small class="text-[9px] text-slate-500 ml-1">kg</small></span>
        </div>
    `).join('');
}

function toggleTimerUI() { 
    document.getElementById('rest-timer-ui').classList.toggle('active'); 
    document.getElementById('rest-timer-ui-overlay').classList.toggle('hidden'); 
}
function toggleTimer() {
    const status = timer.getStatus();
    if (status.isRunning) timer.pause();
    else timer.start();
}
function startPreset(s) { 
    timer.set(s); 
    timer.start(); 
}
function resetTimer() { 
    timer.reset(); 
}
function toggleInfo() { 
    document.getElementById('info-modal').classList.toggle('hidden'); 
}

function startCustom() {
    const val = parseInt(document.getElementById('custom-timer-input').value) || 0;
    if (val > 0) {
        timer.set(val);
        timer.start();
        document.getElementById('custom-timer-input').value = '';
    }
}

function updateStats() {
    // Populate Exercise Selector
    const selector = document.getElementById('exercise-stat-selector');
    if (selector && selector.options.length <= 1) {
        const exercises = [];
        ['A1', 'B1', 'A2', 'B2'].forEach(d => {
            window.workoutData[d].forEach(ex => {
                exercises.push({ id: ex.id, name: ex.name });
            });
        });
        exercises.sort((a, b) => a.name.localeCompare(b.name));
        exercises.forEach(ex => {
            const opt = document.createElement('option');
            opt.value = ex.id;
            opt.innerText = ex.name;
            selector.appendChild(opt);
        });
    }
}

function exportToCSV() {
    console.log('Eksport do CSV - start');
    let csv = 'sep=;\n'; 
    csv += 'Tydzień;Dzień;Ćwiczenie;Tempo;Serie;Powtórzenia;KG;RIR;Przerwa;Rampa Top;Notatki Ćwiczenia;Objetość;Uwagi Trening\n';
    
    for (let w = 1; w <= 8; w++) {
        ['A1', 'B1', 'A2', 'B2'].forEach(dayId => {
            const sessionNote = (window.workoutStore.getSessionNotes(w, dayId) || '').replace(/;/g, ',').replace(/\n/g, ' ');
            window.workoutData[dayId].forEach((ex, idx) => {
                const saved = window.workoutStore.getSavedExercise(w, ex.id);
                const vol = window.workoutStore.calculateVolume(saved.kg, saved.reps, saved.sets_done);
                
                const row = [
                    w,
                    dayId,
                    ex.name.replace(/;/g, ','),
                    ex.tempo,
                    saved.sets_done || 0,
                    saved.reps || 0,
                    saved.kg || 0,
                    (saved.rir || '').replace(/;/g, ','),
                    saved.rest_time || '',
                    saved.ramp_top || '',
                    (saved.notes || '').replace(/;/g, ','),
                    vol,
                    idx === 0 ? sessionNote : '' // Only add session note to first row of that session
                ].join(';');
                csv += row + '\n';
            });
        });
    }

    const encodedUri = "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURIComponent(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "trening_przemka_backup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateExerciseChart() {
    const exId = document.getElementById('exercise-stat-selector').value;
    if (!exId) return;

    const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
    const exerciseData = weeks.map(w => {
        const saved = window.workoutStore.getSavedExercise(w, exId);
        return window.workoutStore.calculateVolume(saved.kg, saved.reps, saved.sets_done);
    });

    const ctx = document.getElementById('exerciseChart');
    if (!ctx) return;

    if (exerciseChartInstance) exerciseChartInstance.destroy();

    exerciseChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks.map(w => `T${w}`),
            datasets: [{
                label: 'Objętość (kg)',
                data: exerciseData,
                backgroundColor: '#10b981',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b', font: { size: 9 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 9 } }
                }
            }
        }
    });

    const dataDiv = document.getElementById('exercise-stats-data');
    dataDiv.innerHTML = exerciseData.map((v, i) => `
        <div class="bg-slate-900/40 p-1.5 rounded">
            <div class="text-slate-500 mb-0.5">T${i + 1}</div>
            <div class="text-emerald-400">${v}</div>
        </div>
    `).join('');
}

// Attach to window for HTML onclicks
window.app = {
    init, changeWeek, changeDay, save, calculateWeights,
    toggleTimerUI, toggleTimer, startPreset, resetTimer, toggleInfo,
    startCustom, updateStats, updateExerciseChart, exportToCSV, saveSessionNote,
    markDotDone
};

document.addEventListener('DOMContentLoaded', init);
