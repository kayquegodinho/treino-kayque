let weeklyCheckins = load('weeklyCheckins', {});

function updateWeeklyCheckin(week, field, value){
  weeklyCheckins[week] = { ...(weeklyCheckins[week] || {}), [field]: value };
  save('weeklyCheckins', weeklyCheckins);
}

function renderProgression(){
  const progressao = document.getElementById('progressaoSection');

  progressao.innerHTML = `
    <div class="card progression-summary">
      <div class="section-title">Controle de cargas</div>
      <p>Semanas de referência: 19/07 até 15/08.</p>

      <div class="progression-loads">
        ${referenceWeeks.map(week => `
          <div>
            <strong>${week.semana} - ${week.periodo}</strong>
            <span>Leg Press ${week.legPress} - Stiff ${week.stiff}</span>
            <span>Step-up ${week.stepUp} - Afundo ${week.afundo}</span>
            <span>Extensora ${week.extensora} - Adutora ${week.adutora}</span>
            <span>Abdutora ${week.abdutora} - Panturrilha ${week.panturrilha}</span>
            <span>Supino ${week.supino} - Puxador ${week.puxador}</span>
            <span>Desenvolvimento ${week.desenvolvimento}</span>
          </div>
        `).join('')}
      </div>

      <div class="progression-note">
        <strong>Aumentar somente quando</strong>
        <span>Dor até 3/10, normalização em 24 horas e sem piora da virilha após o futebol.</span>
      </div>

      <div class="progression-note warning">
        <strong>Não aumentar quando</strong>
        <span>Dor na virilha acima de 5/10, dor crescente na semana ou dor no joelho durante o futebol.</span>
      </div>

      <div class="section-title checkin-title">Controle semanal</div>
      <p>Registre dor de 0 a 10 e confiança da perna esquerda de 0 a 10.</p>
      <div class="weekly-checkins">
        ${referenceWeeks.map(week => {
          const weekNumber = week.controleSemana;
          const values = weeklyCheckins[weekNumber] || {};
          return `
            <div class="weekly-checkin-card">
              <strong>${week.semana}</strong>
              <label>Dor no joelho <input type="number" min="0" max="10" value="${values.knee ?? ''}" data-checkin-week="${weekNumber}" data-checkin-field="knee"></label>
              <label>Dor na virilha <input type="number" min="0" max="10" value="${values.groin ?? ''}" data-checkin-week="${weekNumber}" data-checkin-field="groin"></label>
              <label>Confiança esquerda <input type="number" min="0" max="10" value="${values.confidence ?? ''}" data-checkin-week="${weekNumber}" data-checkin-field="confidence"></label>
              <label>Observações <textarea rows="2" data-checkin-week="${weekNumber}" data-checkin-field="notes">${values.notes ?? ''}</textarea></label>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
