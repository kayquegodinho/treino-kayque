let activeWorkout = load('activeWorkout', 'A');
let activeTrainingDay = new Date().getDay();
let completedSets = load('completedSets', {});
let finishedWorkouts = load('finishedWorkouts', {});
let expandedExerciseId = load('expandedExerciseId', null);

if(Number.isNaN(activeTrainingDay) || activeTrainingDay < 0 || activeTrainingDay > 6){
  activeTrainingDay = new Date().getDay();
}

save('activeTrainingDay', activeTrainingDay);

function getPlanDay(index = activeTrainingDay){
  return weeklyPlan[index] || weeklyPlan[0];
}

function getWorkoutTypeForPlanDay(day = getPlanDay()){
  if(day.tipo === 'treino-b'){
    return 'B';
  }

  if(day.tipo === 'treino-a'){
    return 'A';
  }

  return null;
}

function getWorkoutList(){
  return activeWorkout === 'B' ? treinoB : treinoA;
}

function getWorkoutName(){
  return activeWorkout === 'B' ? 'Full Body B' : 'Full Body A';
}

function getSetKey(exerciseId, index){
  return `${activeWorkout}:${exerciseId}:${index}`;
}

function getWorkoutFinishKey(){
  return `${activeWorkout}:${getDateKey()}`;
}

function getDailyActivityFinishKey(type, date = new Date()){
  return `${type}:${getDateKey(date)}`;
}

function isDailyActivityFinished(type){
  return Boolean(finishedWorkouts[getDailyActivityFinishKey(type)]);
}

function finishDailyActivity(type){
  const labels = {
    mobility: 'Mobilidade + Estabilidade',
    activeRest: 'Descanso ativo'
  };

  finishedWorkouts[getDailyActivityFinishKey(type)] = {
    workout: labels[type] || type,
    date: getToday(),
    dateKey: getDateKey()
  };

  save('finishedWorkouts', finishedWorkouts);
  renderWorkout();
  renderDashboard();
  if(type === 'mobility'){
    renderMobilidade();
  }
}

function getCompletedCount(exercise){
  return Array.from({ length: exercise.series }, (_, index) =>
    completedSets[getSetKey(exercise.id, index)]
  ).filter(Boolean).length;
}

function isExerciseComplete(exercise){
  return getCompletedCount(exercise) === exercise.series;
}

function isWorkoutComplete(){
  return getWorkoutList().every(isExerciseComplete);
}

function findFirstIncompleteExercise(){
  return getWorkoutList().find(exercise => !isExerciseComplete(exercise));
}

function getExerciseLoad(exercise){
  if(!exercise.progressao || typeof getCurrentProgressWeek !== 'function'){
    return exercise.carga;
  }

  const currentWeek = getCurrentProgressWeek(new Date());
  return currentWeek?.[exercise.progressao] || exercise.carga;
}

function getExerciseDetails(exercise){
  return execucaoDetalhada[exercise.id] || {
    comoFazer: exercise.obs,
    erro: 'Evite pressa, dor e perda de controle.'
  };
}

function ensureExpandedExercise(){
  const workout = getWorkoutList();
  const activeExists = workout.some(exercise => exercise.id === expandedExerciseId);

  if(!activeExists){
    const nextExercise = findFirstIncompleteExercise();
    expandedExerciseId = nextExercise ? nextExercise.id : null;
    save('expandedExerciseId', expandedExerciseId);
  }
}

function setWorkout(type){
  activeWorkout = type;
  save('activeWorkout', activeWorkout);

  const nextExercise = findFirstIncompleteExercise();
  expandedExerciseId = nextExercise ? nextExercise.id : null;
  save('expandedExerciseId', expandedExerciseId);

  renderWorkout();
}

function setTrainingDay(index){
  activeTrainingDay = index;
  save('activeTrainingDay', activeTrainingDay);

  const workoutType = getWorkoutTypeForPlanDay(getPlanDay(index));
  if(workoutType){
    activeWorkout = workoutType;
    save('activeWorkout', activeWorkout);

    const nextExercise = findFirstIncompleteExercise();
    expandedExerciseId = nextExercise ? nextExercise.id : null;
    save('expandedExerciseId', expandedExerciseId);
  }

  renderWorkout();
}

function getPlanAction(day){
  if(day.tipo === 'mobilidade' || day.tipo === 'descanso'){
    return {
      label: 'Abrir Mobilidade',
      tab: 'mobilidade',
      mobility: day.dia === 'Sexta' ? 'B' : 'A'
    };
  }

  if(day.tipo === 'ativacao'){
    return {
      label: 'Abrir Aquecer',
      tab: 'aquecer'
    };
  }

  return null;
}

function toggleWorkoutExercise(id){
  expandedExerciseId = expandedExerciseId === id ? null : id;
  save('expandedExerciseId', expandedExerciseId);
  renderWorkout();
}

function resetWorkoutExercise(id, event){
  event?.stopPropagation();
  const exercise = getWorkoutList().find(item => item.id === id);
  if(!exercise){
    return;
  }

  for(let index = 0; index < exercise.series; index++){
    delete completedSets[getSetKey(exercise.id, index)];
  }

  expandedExerciseId = exercise.id;
  save('completedSets', completedSets);
  save('expandedExerciseId', expandedExerciseId);
  renderWorkout();
  renderDashboard();
}

function toggleSet(exerciseId, index, seconds){
  const key = getSetKey(exerciseId, index);
  completedSets[key] = !completedSets[key];
  save('completedSets', completedSets);

  const exercise = getWorkoutList().find(item => item.id === exerciseId);
  if(exercise && isExerciseComplete(exercise)){
    const nextExercise = findFirstIncompleteExercise();
    expandedExerciseId = nextExercise ? nextExercise.id : null;
    save('expandedExerciseId', expandedExerciseId);
  }else{
    expandedExerciseId = exerciseId;
    save('expandedExerciseId', expandedExerciseId);
  }

  renderWorkout();
  renderDashboard();

  if(completedSets[key]){
    startTimer(seconds);
  }
}

function finishWorkout(){
  if(!isWorkoutComplete()){
    return;
  }

  finishedWorkouts[getWorkoutFinishKey()] = {
    workout: getWorkoutName(),
    date: getToday(),
    dateKey: getDateKey()
  };

  getWorkoutList().forEach(exercise => {
    for(let index = 0; index < exercise.series; index++){
      delete completedSets[getSetKey(exercise.id, index)];
    }
  });

  const firstExercise = getWorkoutList()[0];
  expandedExerciseId = firstExercise ? firstExercise.id : null;

  save('completedSets', completedSets);
  save('expandedExerciseId', expandedExerciseId);
  save('finishedWorkouts', finishedWorkouts);
  renderWorkout();
  renderDashboard();
}

function resetWorkout(){
  getWorkoutList().forEach(exercise => {
    for(let index = 0; index < exercise.series; index++){
      delete completedSets[getSetKey(exercise.id, index)];
    }
  });

  delete finishedWorkouts[getWorkoutFinishKey()];
  delete finishedWorkouts[`${activeWorkout}:${getToday()}`];
  save('completedSets', completedSets);
  save('finishedWorkouts', finishedWorkouts);

  const firstExercise = getWorkoutList()[0];
  expandedExerciseId = firstExercise ? firstExercise.id : null;
  save('expandedExerciseId', expandedExerciseId);

  renderWorkout();
  renderDashboard();
}

function renderWorkout(){
  const treino = document.getElementById('treinoSection');
  const selectedPlanDay = getPlanDay();
  const selectedWorkoutType = getWorkoutTypeForPlanDay(selectedPlanDay);

  if(selectedWorkoutType && activeWorkout !== selectedWorkoutType){
    activeWorkout = selectedWorkoutType;
    save('activeWorkout', activeWorkout);
  }

  ensureExpandedExercise();

  const workout = getWorkoutList();
  const doneExercises = workout.filter(isExerciseComplete).length;
  const workoutComplete = selectedWorkoutType ? isWorkoutComplete() : false;
  const workoutFinished = selectedWorkoutType ? Boolean(finishedWorkouts[getWorkoutFinishKey()]) : false;
  const currentWeek = typeof getCurrentProgressWeek === 'function'
    ? getCurrentProgressWeek(new Date())
    : null;
  const action = getPlanAction(selectedPlanDay);

  treino.innerHTML = `
    <div class="week-plan-card">
      <div class="week-plan-title">Treinos da semana</div>
      <div class="week-plan-grid">
        ${weeklyPlan.map((day, index) => `
          <button
            class="week-day ${activeTrainingDay === index ? 'active' : ''} ${day.tipo}"
            data-action="set-training-day"
            data-day-index="${index}"
          >
            <span>${day.dia}</span>
            <strong>${day.atividade}</strong>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="workout-label">
      <strong>${selectedPlanDay.dia}</strong>
      <span>${selectedPlanDay.atividade} - ${selectedPlanDay.detalhes}</span>
    </div>

    ${selectedWorkoutType ? `
      <div class="workout-week-note">
        <span>${getWorkoutName()}</span>
        <strong>${currentWeek ? `${currentWeek.semana} - ${currentWeek.periodo}` : `${workout.length} exercícios da planilha`}</strong>
      </div>

      <div class="workout-phase-card">
        <div>
          <span>Antes do treino</span>
          <strong>Aquecimento de 8-10 minutos</strong>
        </div>
        <button data-action="show-tab" data-tab="aquecer">Abrir</button>
      </div>

      ${workout.map((exercise, exerciseIndex) => {
        const completed = getCompletedCount(exercise);
        const complete = completed === exercise.series;
        const open = expandedExerciseId === exercise.id;

        return `
          <div class="exercise ${complete ? 'complete' : ''}">
            <div class="exercise-header" data-action="toggle-workout-exercise" data-exercise-id="${exercise.id}">
              <div class="exercise-main">
                <div class="exercise-order">${exerciseIndex + 1}</div>
                <div>
                  <div class="exercise-title">${exercise.nome}</div>
                  <div class="exercise-sub">${exercise.obs}</div>
                </div>
              </div>
              <button
                class="exercise-status ${complete ? 'checked undoable' : ''}"
                ${complete ? `data-action="reset-workout-exercise" data-exercise-id="${exercise.id}" title="Desmarcar exercício"` : 'disabled'}
                aria-label="${complete ? 'Desmarcar exercício' : 'Exercício pendente'}"
              >
                ${complete ? 'OK' : '+'}
              </button>
            </div>

            <div class="exercise-content ${open ? 'open' : ''}" id="${exercise.id}-content">
              <div class="exercise-detail">
                <p><strong>Como fazer:</strong> ${getExerciseDetails(exercise).comoFazer}</p>
                <p><strong>Evite:</strong> ${getExerciseDetails(exercise).erro}</p>
                ${exercise.gif ? `<button class="gif-btn wide" data-action="open-gif" data-name="${exercise.nome}" data-gif="${exercise.gif}">Ver GIF de referência</button>` : ''}
              </div>

              <div class="exercise-stats">
                <span>${exercise.series} séries</span>
                <span>${exercise.reps}</span>
                <span>${getExerciseLoad(exercise)}</span>
                <span>${exercise.descanso}</span>
              </div>

              <div class="set-count">${completed}/${exercise.series} séries feitas</div>

              <div class="exercise-series">
                ${Array.from({ length: exercise.series }, (_, index) => {
                  const isDone = completedSets[getSetKey(exercise.id, index)];

                  return `
                    <button
                      class="btn set-btn ${isDone ? 'done' : ''}"
                      data-action="toggle-set"
                      data-exercise-id="${exercise.id}"
                      data-index="${index}"
                      data-seconds="${exercise.descansoSegundos}"
                    >
                      ${isDone ? `${exercise.setLabels?.[index] || `Série ${index + 1}`} OK` : (exercise.setLabels?.[index] || `Série ${index + 1}`)}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <div class="workout-phase-card cooldown">
        <div>
          <span>Depois do treino</span>
          <strong>Caminhada leve e alongamentos</strong>
        </div>
        <button data-action="show-tab" data-tab="alongar">Alongar</button>
      </div>

      <button
        class="finish-btn ${workoutFinished ? 'finished' : ''}"
        data-action="finish-workout"
        ${workoutComplete ? '' : 'disabled'}
      >
        ${workoutFinished ? 'Treino finalizado' : 'Finalizar treino'}
      </button>
    ` : `
      <div class="daily-plan-empty">
        <div>
          <span>${selectedPlanDay.dia}</span>
          <strong>${selectedPlanDay.atividade}</strong>
          <p>${selectedPlanDay.detalhes}</p>
          <ul class="daily-guidance">
            ${(dailyGuidance[activeTrainingDay] || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        ${action ? `<button data-action="show-tab" data-tab="${action.tab}" ${action.mobility ? `data-mobility="${action.mobility}"` : ''}>${action.label}</button>` : ''}
        ${selectedPlanDay.tipo === 'descanso' ? `
          <button
            class="finish-btn ${isDailyActivityFinished('activeRest') ? 'finished' : ''}"
            data-action="finish-daily-activity"
            data-activity-type="activeRest"
          >
            ${isDailyActivityFinished('activeRest') ? 'Descanso ativo concluído' : 'Concluir descanso ativo'}
          </button>
        ` : ''}
      </div>
    `}
  `;

  if(typeof refreshTimerContext === 'function'){
    refreshTimerContext('treino');
  }
}
