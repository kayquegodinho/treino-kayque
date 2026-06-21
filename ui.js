function renderProgression(){
  const progressao = document.getElementById('progressaoSection');

  progressao.innerHTML = `
    <div class="card progression-summary">
      <div class="section-title">Controle de cargas</div>
      <p>Semanas de referência: 21/06 até 18/07.</p>

      <div class="progression-loads">
        ${referenceWeeks.map(week => `
          <div>
            <strong>${week.semana} - ${week.periodo}</strong>
            <span>Leg Press ${week.legPress} - Stiff ${week.stiff}</span>
            <span>Step-up ${week.stepUp} - Afundo ${week.afundo}</span>
            <span>Extensora ${week.extensora} - Adutora ${week.adutora}</span>
            <span>Abdutora ${week.abdutora} - Panturrilha ${week.panturrilha}</span>
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
    </div>
  `;
}
