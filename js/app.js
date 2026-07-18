let completedWarmup = load('completedWarmup', {});
let completedMobility = load('completedMobility', {});
let completedStretching = load('completedStretching', {});
let completedRoutineSets = load('completedRoutineSets', {});
let activeMobility = load('activeMobility', 'A');
let currentTab = 'dashboard';

if(activeMobility !== 'A' && activeMobility !== 'B'){
  activeMobility = 'A';
}

renderWorkout();
renderDashboard();
renderProgression();
renderAquecimento();
renderMobilidade();
renderAlongamentos();

function toggleChecklistItem(storageKey, itemId, items, renderFn){
  const state = storageKey === 'completedWarmup'
    ? completedWarmup
    : storageKey === 'completedMobility'
      ? completedMobility
      : completedStretching;
  state[itemId] = !state[itemId];

  const allDone = items.every(item => state[item.id]);

  if(allDone && scope !== 'mobilidade'){
    items.forEach(item => {
      state[item.id] = false;
    });
  }

  if(storageKey === 'completedWarmup'){
    completedWarmup = state;
  }else if(storageKey === 'completedMobility'){
    completedMobility = state;
  }else{
    completedStretching = state;
  }

  save(storageKey, state);
  renderFn();

  const timerTab = storageKey === 'completedWarmup'
    ? 'aquecer'
    : storageKey === 'completedMobility'
      ? 'mobilidade'
      : 'alongar';
  refreshTimerContext(timerTab);
}

function toggleWarmupItem(itemId){
  toggleChecklistItem('completedWarmup', itemId, aquecimento, renderAquecimento);
}

function toggleMobilityItem(itemId){
  toggleChecklistItem('completedMobility', itemId, getMobilityList(), renderMobilidade);
}

function getMobilityList(){
  return activeMobility === 'B' ? mobilidadeB : mobilidadeA;
}

function setMobility(type){
  activeMobility = type === 'B' ? 'B' : 'A';
  save('activeMobility', activeMobility);
  renderMobilidade();
  refreshTimerContext('mobilidade');
}

function getRoutineConfig(scope){
  if(scope === 'aquecer'){
    return {
      items: aquecimento,
      state: completedWarmup,
      storageKey: 'completedWarmup',
      render: renderAquecimento
    };
  }

  if(scope === 'mobilidade'){
    return {
      items: getMobilityList(),
      state: completedMobility,
      storageKey: 'completedMobility',
      render: renderMobilidade
    };
  }

  return {
    items: alongamentos,
    state: completedStretching,
    storageKey: 'completedStretching',
    render: renderAlongamentos
  };
}

function getBaseRoutineSeries(item){
  const match = String(item.tempo || '').match(/^(\d+)x/i);
  return match ? Number(match[1]) : 1;
}

function getRoutineSetLabels(item, scope){
  if(Array.isArray(item.setLabels) && item.setLabels.length){
    return item.setLabels;
  }

  const value = String(item.tempo || '');
  const baseSeries = getBaseRoutineSeries(item);
  const timedBySide = /cada lado/i.test(value) && /\d+(?:-\d+)?s/i.test(value);

  if(scope === 'alongar' || timedBySide){
    if(baseSeries === 1){
      return ['Esquerda', 'Direita'];
    }

    return Array.from({ length: baseSeries }, (_, index) => [
      `Série ${index + 1} esquerda`,
      `Série ${index + 1} direita`
    ]).flat();
  }

  return Array.from({ length: baseSeries }, (_, index) =>
    baseSeries === 1 ? 'Concluir' : `Série ${index + 1}`
  );
}

function getRoutineSeries(item, scope){
  return getRoutineSetLabels(item, scope).length;
}

function getRoutineExecutionSeconds(item){
  const value = String(item.tempo || '');
  const minutes = value.match(/(\d+)(?:-(\d+))?\s*min/i);
  if(minutes){
    return Number(minutes[2] || minutes[1]) * 60;
  }

  const seconds = value.match(/(\d+)(?:-(\d+))?s/i);
  if(seconds){
    return Number(seconds[2] || seconds[1]);
  }

  return 60;
}

function getRoutineRestSeconds(item){
  return item.descansoSegundos || 60;
}

function getRoutineSetKey(scope, itemId, index){
  return `${scope}:${itemId}:${index}`;
}

function isRoutineSetDone(scope, item, index, state){
  return Boolean(
    completedRoutineSets[getRoutineSetKey(scope, item.id, index)] ||
    state[item.id]
  );
}

function isRoutineItemComplete(scope, item, state){
  return Array.from({ length: getRoutineSeries(item, scope) }, (_, index) =>
    isRoutineSetDone(scope, item, index, state)
  ).every(Boolean);
}

function formatRoutineSeconds(seconds){
  const minutes = Math.floor(seconds / 60);
  const remaining = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function startRoutineExercise(scope, itemId, index = 0){
  const config = getRoutineConfig(scope);
  const item = config.items.find(entry => entry.id === itemId);
  if(!item){
    return;
  }

  startTimer(
    getRoutineExecutionSeconds(item),
    'Exercício',
    () => completeRoutineSet(scope, itemId, index)
  );
}

function completeRoutineSet(scope, itemId, index){
  const key = getRoutineSetKey(scope, itemId, index);
  if(completedRoutineSets[key]){
    return;
  }

  toggleRoutineSet(scope, itemId, index, true);
}

function resetRoutineItem(scope, itemId){
  const config = getRoutineConfig(scope);
  const item = config.items.find(entry => entry.id === itemId);
  if(!item){
    return;
  }

  config.state[item.id] = false;
  for(let index = 0; index < getRoutineSeries(item, scope); index++){
    delete completedRoutineSets[getRoutineSetKey(scope, item.id, index)];
  }

  save(config.storageKey, config.state);
  save('completedRoutineSets', completedRoutineSets);
  config.render();
  refreshTimerContext(scope);
}

function toggleRoutineSet(scope, itemId, index, forceComplete = false){
  const config = getRoutineConfig(scope);
  const item = config.items.find(entry => entry.id === itemId);
  if(!item){
    return;
  }

  const series = getRoutineSeries(item, scope);
  const hasExplicitSets = Array.from({ length: series }, (_, setIndex) =>
    completedRoutineSets[getRoutineSetKey(scope, item.id, setIndex)]
  ).some(Boolean);

  if(config.state[item.id] && !hasExplicitSets){
    for(let setIndex = 0; setIndex < series; setIndex++){
      completedRoutineSets[getRoutineSetKey(scope, item.id, setIndex)] = true;
    }
  }

  const key = getRoutineSetKey(scope, item.id, index);
  completedRoutineSets[key] = forceComplete ? true : !completedRoutineSets[key];
  config.state[item.id] = Array.from({ length: series }, (_, setIndex) =>
    completedRoutineSets[getRoutineSetKey(scope, item.id, setIndex)]
  ).every(Boolean);

  const justCompletedSet = completedRoutineSets[key];
  const itemComplete = config.state[item.id];
  const allDone = config.items.every(entry => isRoutineItemComplete(scope, entry, config.state));

  if(allDone){
    config.items.forEach(entry => {
      config.state[entry.id] = false;
      for(let setIndex = 0; setIndex < getRoutineSeries(entry, scope); setIndex++){
        delete completedRoutineSets[getRoutineSetKey(scope, entry.id, setIndex)];
      }
    });
  }

  save(config.storageKey, config.state);
  save('completedRoutineSets', completedRoutineSets);
  config.render();
  refreshTimerContext(scope);

  const restSeconds = getRoutineRestSeconds(item);
  if(justCompletedSet && restSeconds > 0){
    startTimer(restSeconds, 'Descanso');
  }
}

function renderRoutineItem(item, scope, state){
  const setLabels = getRoutineSetLabels(item, scope);
  const series = getRoutineSeries(item, scope);
  const executionSeconds = getRoutineExecutionSeconds(item);
  const restSeconds = getRoutineRestSeconds(item);
  const complete = isRoutineItemComplete(scope, item, state);
  const value = String(item.tempo || '');
  const timedActivity = scope === 'alongar' || /\d+(?:-\d+)?s/i.test(value) || (series === 1 && /\bmin\b/i.test(value));

  return `
    <div class="routine-step ${complete ? 'complete' : ''}">
      <div class="routine-copy">
        <strong>${item.tempo} ${item.nome}</strong>
        <p>${item.descricao}</p>
        ${item.erros ? `<p class="routine-warning"><b>Evite:</b> ${item.erros}</p>` : ''}
      </div>
      ${gifButton(item)}
      <button
        class="exercise-status ${complete ? 'checked undoable' : ''}"
        ${complete ? `data-action="reset-routine-item" data-scope="${scope}" data-item-id="${item.id}" title="Desmarcar exercício"` : 'disabled'}
        aria-label="${complete ? 'Desmarcar exercício' : 'Exercício pendente'}"
      >OK</button>

      <div class="routine-controls">
        ${timedActivity && series > 1 ? `
          <div class="routine-series stretch-sides">
            ${setLabels.map((label, index) => {
              const done = isRoutineSetDone(scope, item, index, state);
              return `
                <button
                  class="routine-set-btn ${done ? 'done' : ''}"
                  data-action="${done ? 'toggle-routine-set' : 'start-routine-exercise'}"
                  data-scope="${scope}"
                  data-item-id="${item.id}"
                  data-index="${index}"
                >
                  ${done ? `${label} OK` : `Iniciar ${label.toLowerCase()} - ${formatRoutineSeconds(executionSeconds)}`}
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${timedActivity && series === 1 ? `
          <button class="start-exercise-btn" data-action="start-routine-exercise" data-scope="${scope}" data-item-id="${item.id}" data-index="0">
            ${complete ? 'Repetir' : 'Iniciar'} - ${formatRoutineSeconds(executionSeconds)}
          </button>
        ` : ''}

        <span class="routine-rest">Descanso após cada série: ${formatRoutineSeconds(restSeconds)}</span>

        ${!timedActivity ? `
          <div class="routine-series">
            ${setLabels.map((label, index) => {
              const done = isRoutineSetDone(scope, item, index, state);
              return `
                <button
                  class="routine-set-btn ${done ? 'done' : ''}"
                  data-action="toggle-routine-set"
                  data-scope="${scope}"
                  data-item-id="${item.id}"
                  data-index="${index}"
                >
                  ${done ? `${label} OK` : label}
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getChecklistDone(items, state){
  return items.filter(item => state[item.id]).length;
}

function refreshTimerContext(tabName){
  if(tabName === 'aquecer'){
    const done = getChecklistDone(aquecimento, completedWarmup);
    updateTimerContext(done, aquecimento.length, `${done}/${aquecimento.length} etapas concluídas`);
    return;
  }

  if(tabName === 'mobilidade'){
    const mobilityList = getMobilityList();
    const done = getChecklistDone(mobilityList, completedMobility);
    updateTimerContext(done, mobilityList.length, `${done}/${mobilityList.length} etapas concluídas`);
    return;
  }

  if(tabName === 'alongar'){
    const done = getChecklistDone(alongamentos, completedStretching);
    updateTimerContext(done, alongamentos.length, `${done}/${alongamentos.length} alongamentos concluídos`);
    return;
  }

  if(tabName === 'treino'){
    const selectedPlanDay = getPlanDay();
    const workoutType = getWorkoutTypeForPlanDay(selectedPlanDay);

    if(!workoutType){
      updateTimerContext(0, 0, selectedPlanDay.atividade);
      return;
    }

    const workout = getWorkoutList();
    const done = workout.filter(isExerciseComplete).length;
    updateTimerContext(done, workout.length, `${done}/${workout.length} exercícios completos`);
  }
}

function toggleStretchingItem(itemId){
  toggleChecklistItem('completedStretching', itemId, alongamentos, renderAlongamentos);
}

function openExerciseGif(name, gif){
  const modal = document.getElementById('gifModal');
  const title = document.getElementById('gifModalTitle');
  const image = document.getElementById('gifModalImage');
  const source = document.getElementById('gifModalSource');
  const video = document.getElementById('gifModalVideo');

  if(!modal || !title || !image){
    return;
  }

  title.innerText = name;
  image.src = gif;
  image.alt = `GIF de referência - ${name}`;
  if(source){
    source.innerText = `Fonte: ${gifSourceFor(gif)}`;
  }
  if(video){
    video.href = videoFor(name);
    video.setAttribute('aria-label', `Ver video curto de ${name}`);
  }
  modal.classList.add('open');
}

function closeExerciseGif(){
  const modal = document.getElementById('gifModal');
  const image = document.getElementById('gifModalImage');
  const source = document.getElementById('gifModalSource');
  const video = document.getElementById('gifModalVideo');

  if(!modal || !image){
    return;
  }

  modal.classList.remove('open');
  image.src = '';
  if(source){
    source.innerText = '';
  }
  if(video){
    video.href = '#';
  }
}

function gifButton(item){
  if(!item.gif){
    return '';
  }

  return `
    <button class="gif-btn" data-action="open-gif" data-name="${item.nome}" data-gif="${item.gif}">
      GIF
    </button>
  `;
}

function renderAquecimento(){
  const aquecer = document.getElementById('aquecerSection');

  aquecer.innerHTML = `
    <div class="section-heading">
      <div>
        <div class="section-title">Aquecimento</div>
        <p class="muted">Sequência de 8-10 minutos antes dos treinos Full Body.</p>
      </div>
    </div>

    <div class="routine-list">
      ${aquecimento.map(item => renderRoutineItem(item, 'aquecer', completedWarmup)).join('')}
    </div>
  `;
}

function renderMobilidade(){
  const mobilidadeSection = document.getElementById('mobilidadeSection');
  const mobilityList = getMobilityList();
  const mobilityDay = activeMobility === 'B' ? 'Sexta-feira' : 'Segunda-feira';
  const mobilityComplete = mobilityList.every(item =>
    isRoutineItemComplete('mobilidade', item, completedMobility)
  );
  const mobilityFinished = isDailyActivityFinished('mobility');

  mobilidadeSection.innerHTML = `
    <div class="section-heading">
      <div>
        <div class="section-title">Mobilidade</div>
        <p class="muted">Mobilidade e Pilates funcional separados por dia.</p>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="segmented-control" aria-label="Selecionar rotina de mobilidade">
        <button class="segment ${activeMobility === 'A' ? 'active' : ''}" data-action="set-mobility" data-mobility="A">Mobilidade A</button>
        <button class="segment ${activeMobility === 'B' ? 'active' : ''}" data-action="set-mobility" data-mobility="B">Mobilidade B</button>
      </div>
    </div>

    <div class="workout-label mobility-label">
      <strong>${activeMobility === 'A' ? 'Mobilidade A' : 'Mobilidade B'}</strong>
      <span>${mobilityDay} - 30-40 min - ${mobilityList.length} etapas</span>
    </div>

    <div class="routine-list">
      ${mobilityList.map((item, index) => `
        ${index === 0 || item.grupo !== mobilityList[index - 1].grupo
          ? `<div class="routine-group">${item.grupo}</div>`
          : ''}
        ${renderRoutineItem(item, 'mobilidade', completedMobility)}
      `).join('')}
    </div>

    <button
      class="finish-btn ${mobilityFinished ? 'finished' : ''}"
      data-action="finish-daily-activity"
      data-activity-type="mobility"
      ${mobilityComplete || mobilityFinished ? '' : 'disabled'}
    >
      ${mobilityFinished ? 'Mobilidade finalizada' : 'Finalizar mobilidade'}
    </button>
  `;
}

function renderAlongamentos(){
  const alongar = document.getElementById('alongarSection');

  alongar.innerHTML = `
    <div class="section-heading">
      <div>
        <div class="section-title">Alongar</div>
        <p class="muted">Quadríceps, posterior, virilha e panturrilha sem forçar dor.</p>
      </div>
    </div>

    <div class="routine-list">
      ${alongamentos.map(item => renderRoutineItem(item, 'alongar', completedStretching)).join('')}
    </div>
  `;
}

const tabs = document.querySelectorAll('.tab');

const sections = {
  aquecer: document.getElementById('aquecerSection'),
  mobilidade: document.getElementById('mobilidadeSection'),
  treino: document.getElementById('treinoSection'),
  alongar: document.getElementById('alongarSection'),
  progressao: document.getElementById('progressaoSection'),
  dashboard: document.getElementById('dashboardSection')
};

function showTab(tabName){
  currentTab = tabName;
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  Object.entries(sections).forEach(([name, section]) => {
    section.style.display = name === tabName ? 'block' : 'none';
  });

  const timer = document.getElementById('floatingTimer');
  const timerTabs = ['aquecer', 'mobilidade', 'treino', 'alongar'];
  if(timer){
    timer.style.display = timerTabs.includes(tabName) ? 'block' : 'none';
  }

  if(timerTabs.includes(tabName)){
    refreshTimerContext(tabName);
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

showTab('dashboard');
