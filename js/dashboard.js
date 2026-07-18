function getMonthName(date){
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
}

function getLongDate(date){
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getEstimatedSetSeconds(reps){
  const value = String(reps || '');
  const timedSet = value.match(/(\d+)\s*s/i);
  if(timedSet){
    return Number(timedSet[1]);
  }

  const repetitionValues = value.match(/\d+/g)?.map(Number) || [10];
  const repetitions = Math.max(...repetitionValues);
  const sideMultiplier = /cada|lado/i.test(value) ? 2 : 1;

  return Math.max(30, repetitions * sideMultiplier * 3);
}

function getEstimatedWorkoutMinutes(workout){
  const warmupSeconds = 9 * 60;
  const transitionSeconds = Math.max(0, workout.length - 1) * 20;
  const workoutSeconds = workout.reduce((total, exercise) => {
    const series = Number(exercise.series) || 1;
    const executionSeconds = getEstimatedSetSeconds(exercise.reps) * series;
    const restSeconds = (Number(exercise.descansoSegundos) || 0) * Math.max(0, series - 1);

    return total + executionSeconds + restSeconds;
  }, 0);

  return Math.ceil((warmupSeconds + transitionSeconds + workoutSeconds) / 60);
}

function getTodayActivityEstimate(date = new Date()){
  const todayPlan = weeklyPlan[date.getDay()];
  if(todayPlan?.tipo === 'treino-a'){
    return {
      duration: `~${getEstimatedWorkoutMinutes(treinoA)} min`,
      note: 'Inclui 8-10 min de aquecimento, séries, descansos e transições.'
    };
  }

  if(todayPlan?.tipo === 'treino-b'){
    return {
      duration: `~${getEstimatedWorkoutMinutes(treinoB)} min`,
      note: 'Inclui 8-10 min de aquecimento, séries, descansos e transições.'
    };
  }

  if(todayPlan?.tipo === 'mobilidade'){
    return {
      duration: '30–40 min',
      note: 'Mobilidade e Pilates funcional programados para hoje.'
    };
  }

  if(todayPlan?.tipo === 'ativacao'){
    return {
      duration: '5 min + futebol',
      note: 'A estimativa considera a ativação; o tempo do futebol pode variar.'
    };
  }

  return {
    duration: '10–20 min',
    note: 'Caminhada leve ou 5 min de mobilidade no descanso ativo.'
  };
}

const referenceWeeks = [
  {
    ...progressaoSemanal[0],
    controleSemana: 5,
    inicio: new Date(2026, 6, 19),
    fim: new Date(2026, 6, 25),
    periodo: '19/07 a 25/07'
  },
  {
    ...progressaoSemanal[1],
    controleSemana: 6,
    inicio: new Date(2026, 6, 26),
    fim: new Date(2026, 7, 1),
    periodo: '26/07 a 01/08'
  },
  {
    ...progressaoSemanal[2],
    controleSemana: 7,
    inicio: new Date(2026, 7, 2),
    fim: new Date(2026, 7, 8),
    periodo: '02/08 a 08/08'
  },
  {
    ...progressaoSemanal[3],
    controleSemana: 8,
    inicio: new Date(2026, 7, 9),
    fim: new Date(2026, 7, 15),
    periodo: '09/08 a 15/08'
  }
];

function getCurrentProgressWeek(date){
  const currentDate = normalizeDate(date);
  const currentWeek = referenceWeeks.find(week =>
    currentDate >= normalizeDate(week.inicio) &&
    currentDate <= normalizeDate(week.fim)
  );

  if(currentWeek){
    return {
      ...currentWeek,
      status: 'Semana atual'
    };
  }

  if(currentDate < normalizeDate(referenceWeeks[0].inicio)){
    return {
      ...referenceWeeks[0],
      status: 'Próxima semana'
    };
  }

  return {
    ...referenceWeeks[referenceWeeks.length - 1],
    status: 'Ciclo concluido'
  };
}

function wasWorkoutFinishedOnDate(date){
  const isoKey = getDateKey(date);
  const legacyKey = getPtBrDateKey(date);

  return Object.entries(finishedWorkouts || {}).some(([key, value]) =>
    key === `A:${isoKey}` ||
    key === `B:${isoKey}` ||
    key === `A:${legacyKey}` ||
    key === `B:${legacyKey}` ||
    value?.dateKey === isoKey ||
    value?.date === legacyKey
  );
}

function isSameOrBeforeToday(date, today){
  return normalizeDate(date) <= normalizeDate(today);
}

function getCalendarStatus(date, today){
  if(wasWorkoutFinishedOnDate(date)){
    return 'trained';
  }

  if(normalizeDate(date) < normalizeDate(today)){
    return 'missed';
  }

  return 'neutral';
}

function getCalendarDays(date){
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmptyDays = firstDay.getDay();
  const days = [];

  for(let index = 0; index < leadingEmptyDays; index++){
    days.push(null);
  }

  for(let day = 1; day <= lastDay.getDate(); day++){
    days.push(new Date(year, month, day));
  }

  while(days.length % 7 !== 0){
    days.push(null);
  }

  return days;
}

function getTrainingStreak(today = new Date()){
  let cursor = normalizeDate(today);
  let streak = 0;

  if(!wasWorkoutFinishedOnDate(cursor)){
    cursor.setDate(cursor.getDate() - 1);
  }

  while(wasWorkoutFinishedOnDate(cursor)){
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function renderDashboard(){
  const dashboard = document.getElementById('dashboardSection');
  const today = new Date();
  const currentWeek = getCurrentProgressWeek(today);
  const calendarDays = getCalendarDays(today);
  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const streak = getTrainingStreak(today);
  const activityEstimate = getTodayActivityEstimate(today);

  dashboard.innerHTML = `
    <div class="today-panel">
      <div class="today-card">
        <span>Data</span>
        <strong>${getLongDate(today)}</strong>
      </div>

      <div class="today-card">
        <span>Semana da planilha</span>
        <strong>${currentWeek.semana.replace('Semana ', '')}/8</strong>
      </div>

      <div class="today-card">
        <span>Duração estimada da atividade de hoje</span>
        <strong>${activityEstimate.duration}</strong>
        <p>${activityEstimate.note}</p>
      </div>
    </div>

    <div class="streak-card">
      <div>
        <span>Dias em sequência</span>
        <strong>${streak}</strong>
      </div>
      <p>${streak > 0 ? 'Ritmo ativo' : 'Comece hoje'}</p>
    </div>

    <div class="card calendar-card">
      <div class="calendar-heading">
        <div>
          <div class="card-title">Calendário mensal</div>
          <p class="muted">${getMonthName(today)}</p>
        </div>
      </div>

      <div class="calendar-grid calendar-weekdays">
        ${weekdayLabels.map(label => `<div>${label}</div>`).join('')}
      </div>

      <div class="calendar-grid month-calendar">
        ${calendarDays.map(date => {
          if(!date){
            return '<div class="calendar-day empty"></div>';
          }

          const isToday = getDateKey(date) === getDateKey(today);
          const status = getCalendarStatus(date, today);

          return `
            <div class="calendar-day ${status} ${isToday ? 'today' : ''}">
              <div class="calendar-date">
                <strong>${date.getDate()}</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
