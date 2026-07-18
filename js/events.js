// Centraliza as interações da interface em um único ponto.

const actionHandlers = {
  'reset-timer': () => resetTimer(),
  'close-gif': () => closeExerciseGif(),
  'stop-propagation': ({ event }) => event.stopPropagation(),
  'reset-routine-item': ({ element }) =>
    resetRoutineItem(element.dataset.scope, element.dataset.itemId),
  'start-routine-exercise': ({ element }) =>
    startRoutineExercise(
      element.dataset.scope,
      element.dataset.itemId,
      Number(element.dataset.index)
    ),
  'toggle-routine-set': ({ element }) =>
    toggleRoutineSet(
      element.dataset.scope,
      element.dataset.itemId,
      Number(element.dataset.index)
    ),
  'open-gif': ({ element }) =>
    openExerciseGif(element.dataset.name, element.dataset.gif),
  'set-mobility': ({ element }) => setMobility(element.dataset.mobility),
  'set-training-day': ({ element }) =>
    setTrainingDay(Number(element.dataset.dayIndex)),
  'show-tab': ({ element }) => {
    if(element.dataset.mobility){
      setMobility(element.dataset.mobility);
    }
    showTab(element.dataset.tab);
  },
  'toggle-workout-exercise': ({ element }) =>
    toggleWorkoutExercise(element.dataset.exerciseId),
  'reset-workout-exercise': ({ element, event }) =>
    resetWorkoutExercise(element.dataset.exerciseId, event),
  'toggle-set': ({ element }) =>
    toggleSet(
      element.dataset.exerciseId,
      Number(element.dataset.index),
      Number(element.dataset.seconds)
    ),
  'finish-workout': () => finishWorkout(),
  'finish-daily-activity': ({ element }) =>
    finishDailyActivity(element.dataset.activityType)
};

document.addEventListener('click', event => {
  const element = event.target.closest('[data-action]');
  if(!element){
    return;
  }

  const handler = actionHandlers[element.dataset.action];
  handler?.({ element, event });
});

document.addEventListener('input', event => {
  const element = event.target.closest('[data-checkin-field]');
  if(element){
    updateWeeklyCheckin(element.dataset.checkinWeek, element.dataset.checkinField, element.value);
  }
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.dataset.action = 'show-tab';
});
