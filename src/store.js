const STORAGE_VERSION = 'v2.1';

function getSavedExercise(week, id) {
    const key = `kot_prz_${STORAGE_VERSION}_w${week}_${id}`;
    return JSON.parse(localStorage.getItem(key) || '{"kg":"","reps":"","rir":"","sets_done":""}');
}

function saveExercise(week, id, field, value) {
    const key = `kot_prz_${STORAGE_VERSION}_w${week}_${id}`;
    let data = JSON.parse(localStorage.getItem(key) || '{}');
    data[field] = value;
    localStorage.setItem(key, JSON.stringify(data));
    return data;
}

function calculateVolume(kg, reps, sets) {
    const v_kg = parseFloat(kg) || 0;
    const v_reps = parseFloat(reps) || 0;
    const v_sets = parseFloat(sets) || 0;
    return v_kg * v_reps * v_sets;
}

window.workoutStore = { getSavedExercise, saveExercise, calculateVolume };
