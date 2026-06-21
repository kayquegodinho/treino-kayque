/* =====================================================
TREINO KAYQUE PREMIUM
Dados importados da Planilha_Treino_Kayque_Atualizada_20_06_2026.xlsx
===================================================== */

function normalizeGifKey(name){
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const exerciseGifMap = {
  'caminhada-ou-bike': 'https://fitnessprogramer.com/wp-content/uploads/2023/01/Bike-for-aerobic-workout.gif',
  'agachamentos-leves': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Bodyweight-Squat.gif',
  'elevacoes-de-joelho': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/STANDING-KNEE-HUGS.gif',
  'aberturas-de-perna': 'https://static.exercisedb.dev/media/7WaDzyL.gif',
  'extensora': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif',
  'extensao-de-joelho-sentado': 'https://fitnessprogramer.com/wp-content/uploads/2025/05/seated-knee-extension.gif',
  'isometria-adutor': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/HIP-ADDUCTION-MACHINE.gif',
  'isometria-de-adutor': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/HIP-ADDUCTION-MACHINE.gif',
  'step-up': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Step-up.gif',
  'step-up-leve': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Step-up.gif',
  'leg-press-unilateral': 'https://fitnessprogramer.com/wp-content/uploads/2015/11/Leg-Press.gif',
  'afundo': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif',
  'afundo-leve': 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Bodyweight-Walking-Lunge.gif',
  'stiff': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif',
  'adutora': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/HIP-ADDUCTION-MACHINE.gif',
  'adutores': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Adductor-Magnus-Stretch.gif',
  'abdutora': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/HiP-ABDUCTION-MACHINE.gif',
  'supino-maquina': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Chest-Press-Machine.gif',
  'supino-leve': 'https://fitnessprogramer.com/wp-content/uploads/2022/12/Chest-workout-Barbell-Bench-Press.gif',
  'puxador-frente': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif',
  'desenvolvimento-maquina': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Smith-Machine-Shoulder-Press.gif',
  'extensora-unilateral': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif',
  'panturrilha': 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Standing-Calf-Raise.gif',
  'remada': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Row-Machine.gif',
  'prancha': 'https://fitnessprogramer.com/wp-content/uploads/2022/12/plank-for-bodyweight-exercises.gif',
  'respiracao-diafragmatica': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Diaphragmatic_breathing.gif',
  'cat-camel': 'https://fitnessprogramer.com/wp-content/uploads/2022/12/Pilates-Exercises-cat-cow.gif',
  'mobilidade-de-quadril': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Side-Lunge-Stretch.gif',
  'alongamento-flexor-quadril': 'https://media.tenor.com/wEitxLHgDYMAAAAC/workout-working-out.gif',
  'rotacao-toracica': 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Standing-Reach-Up-Back-rotation-Stretch.gif',
  'ponte-de-gluteo': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif',
  'ponte-unilateral': 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Single-Leg-Bridge.gif',
  'dead-bug': 'https://fitnessprogramer.com/wp-content/uploads/2022/12/Pilates-exercises-Dead-Bug.gif',
  'bird-dog': 'https://fitnessprogramer.com/wp-content/uploads/2022/12/Pilates-Exercises-Bird-Dog.gif',
  'clamshell': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Side-Lying-Clam.gif',
  'prancha-lateral': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Front-to-Side-Plank.gif',
  'copenhagen-leve': 'https://fitnessprogramer.com/wp-content/uploads/2024/09/Side-Plank-Hip-Adduction.gif',
  'quadriceps': 'https://media.tenor.com/1Nlgk61HMloAAAAC/quad-stretch.gif',
  'posterior': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Standing-Hamstring-Stretch.gif'
};

function gifFor(name){
  const key = normalizeGifKey(name);
  return exerciseGifMap[key] || '';
}

const exerciseVideoSearchMap = {
  'caminhada-ou-bike': 'caminhada esteira ou bicicleta aquecimento execucao',
  'agachamentos-leves': 'agachamento livre execucao correta',
  'elevacoes-de-joelho': 'elevacao de joelho em pe execucao',
  'aberturas-de-perna': 'abducao de quadril em pe execucao',
  'extensora': 'cadeira extensora execucao correta',
  'isometria-adutor': 'isometria de adutores com almofada',
  'isometria-de-adutor': 'isometria de adutores com almofada',
  'step-up': 'step up execucao correta',
  'step-up-leve': 'step up execucao correta',
  'leg-press-unilateral': 'leg press unilateral execucao correta',
  'afundo': 'afundo com halteres execucao correta',
  'afundo-leve': 'afundo sem peso execucao correta',
  'stiff': 'stiff levantamento romeno execucao correta',
  'adutora': 'cadeira adutora execucao correta',
  'abdutora': 'cadeira abdutora execucao correta',
  'supino-maquina': 'supino maquina execucao correta',
  'supino-leve': 'supino reto com barra execucao correta',
  'puxador-frente': 'puxada frente execucao correta',
  'desenvolvimento-maquina': 'desenvolvimento maquina execucao correta',
  'extensora-unilateral': 'cadeira extensora unilateral execucao correta',
  'extensao-de-joelho-sentado': 'extensao de joelho sentado execucao correta',
  'panturrilha': 'elevacao de panturrilha em pe execucao',
  'remada': 'remada sentada maquina execucao correta',
  'prancha': 'prancha abdominal execucao correta',
  'respiracao-diafragmatica': 'respiracao diafragmatica como fazer',
  'cat-camel': 'cat camel mobilidade execucao',
  'mobilidade-de-quadril': 'mobilidade de quadril rotina curta',
  'alongamento-flexor-quadril': 'alongamento flexor do quadril execucao',
  'rotacao-toracica': 'rotacao toracica mobilidade execucao',
  'ponte-de-gluteo': 'ponte de gluteo execucao correta',
  'ponte-unilateral': 'ponte unilateral execucao correta',
  'dead-bug': 'dead bug execucao correta',
  'bird-dog': 'bird dog execucao correta',
  'clamshell': 'clamshell exercicio execucao correta',
  'prancha-lateral': 'prancha lateral execucao correta',
  'copenhagen-leve': 'copenhagen plank iniciante execucao',
  'quadriceps': 'alongamento quadriceps em pe execucao',
  'posterior': 'alongamento posterior de coxa em pe',
  'adutores': 'alongamento adutores virilha execucao'
};

function videoFor(name){
  const key = normalizeGifKey(name);
  const query = exerciseVideoSearchMap[key] || `${name} execucao correta`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIYAQ%253D%253D`;
}

function gifSourceFor(gif){
  return gif && gif.includes('fitnessprogramer.com')
    ? 'FitnessProgramer'
    : 'Referência externa';
}

const weeklyPlan = [
  {
    dia: 'Domingo',
    atividade: 'Descanso Ativo',
    detalhes: 'Caminhada leve 10-20 min ou mobilidade 5 min',
    tipo: 'descanso'
  },
  {
    dia: 'Segunda',
    atividade: 'Mobilidade + Pilates',
    detalhes: 'Recuperação e cuidado com a virilha',
    tipo: 'mobilidade'
  },
  {
    dia: 'Terca',
    atividade: 'Full Body A',
    detalhes: 'Forca com cargas controladas',
    tipo: 'treino-a'
  },
  {
    dia: 'Quarta',
    atividade: 'Ativacao + Futebol',
    detalhes: 'Intensidade moderada, sem testar limites',
    tipo: 'ativacao'
  },
  {
    dia: 'Quinta',
    atividade: 'Full Body B',
    detalhes: 'Controle e estabilidade',
    tipo: 'treino-b'
  },
  {
    dia: 'Sexta',
    atividade: 'Mobilidade + Pilates',
    detalhes: 'Recuperacao e preparo para sabado',
    tipo: 'mobilidade'
  },
  {
    dia: 'Sabado',
    atividade: 'Full Body A',
    detalhes: 'Full Body A com as cargas da semana atual',
    tipo: 'treino-a'
  }
];

const dailyGuidance = {
  0: [
    'Caminhada leve por 10-20 minutos ou rotina de mobilidade de 5 minutos.',
    'Evite passar o dia inteiro sentado.',
    'Objetivo: recuperação, circulação e redução da rigidez.'
  ],
  1: [
    'Execute a Mobilidade A completa por 30-40 minutos.'
  ],
  3: [
    'Antes: caminhada 2 min, mobilidade leve, extensora 1x15 e step-up 1x10.',
    'Durante: intensidade moderada, sem sprint maximo ou arrancadas violentas.',
    'Depois: caminhada leve, alongamentos e ponte de gluteo 2x12.'
  ],
  5: [
    'Execute a Mobilidade B completa, igual a segunda-feira.',
    'Objetivo: recuperar, soltar quadril, melhorar virilha e preparar para sábado.'
  ]
};

const aquecimento = [
  {
    id: 'aquecimento-caminhada-bike',
    nome: 'Caminhada ou bike',
    descricao: 'Ritmo leve para preparar o corpo sem cansar.',
    tempo: '2-3 min',
    gif: gifFor('Caminhada ou bike')
  },
  {
    id: 'aquecimento-agachamento',
    nome: 'Agachamentos leves',
    descricao: 'Movimento curto, controlado e sem dor para aquecer joelho e quadril.',
    tempo: '10 reps',
    gif: gifFor('Agachamentos leves')
  },
  {
    id: 'aquecimento-elevacao-joelho',
    nome: 'Elevacoes de joelho',
    descricao: 'Eleve um joelho por vez com controle, mantendo equilibrio.',
    tempo: '10 reps',
    gif: gifFor('Elevacoes de joelho')
  },
  {
    id: 'aquecimento-abertura-perna',
    nome: 'Aberturas de perna',
    descricao: 'Abra a perna com controle para preparar o quadril e os adutores.',
    tempo: '10 reps',
    gif: gifFor('Aberturas de perna')
  },
  {
    id: 'aquecimento-extensora',
    nome: 'Extensora',
    descricao: 'Extensora leve para ativar quadriceps antes do treino principal.',
    tempo: '1x15 - 15 kg',
    gif: gifFor('Extensora')
  },
  {
    id: 'aquecimento-isometria-adutor',
    nome: 'Isometria adutor',
    descricao: 'Aperte uma almofada ou bola entre os joelhos com pressao confortavel.',
    tempo: '20-30s',
    gif: gifFor('Isometria adutor')
  },
  {
    id: 'aquecimento-step-up-leve',
    nome: 'Step-up leve',
    descricao: 'Suba em degrau baixo e desca devagar, sem impulso.',
    tempo: '10 reps',
    gif: gifFor('Step-up leve')
  }
];

const execucaoDetalhada = {
  'step-up': {
    comoFazer: 'Subir no degrau e descer em 3 segundos.',
    erro: 'Usar impulso.'
  },
  'leg-press-unilateral': {
    comoFazer: 'Empurrar sem travar o joelho.',
    erro: 'Descer demais.'
  },
  'afundo': {
    comoFazer: 'Passo curto e controle total.',
    erro: 'Passo longo.'
  },
  'afundo-leve': {
    comoFazer: 'Passo curto e controle total.',
    erro: 'Passo longo.'
  },
  'stiff': {
    comoFazer: 'Quadril para tras e coluna reta.',
    erro: 'Curvar costas.'
  },
  'adutora-a': {
    comoFazer: 'Movimento lento.',
    erro: 'Bater os pesos.'
  },
  'adutora-b': {
    comoFazer: 'Movimento lento.',
    erro: 'Bater os pesos.'
  },
  'prancha-a': {
    comoFazer: 'Corpo reto.',
    erro: 'Quadril cair.'
  },
  'prancha-b': {
    comoFazer: 'Corpo reto.',
    erro: 'Quadril cair.'
  }
};

const treinoA = [
  {
    id: 'step-up',
    nome: 'Step-up',
    obs: 'Subir no degrau e descer em 3 segundos',
    series: 3,
    reps: '10/cada',
    carga: 'Peso corporal',
    progressao: 'stepUp',
    descanso: '60-90s',
    descansoSegundos: 75,
    gif: gifFor('Step-up')
  },
  {
    id: 'leg-press-unilateral',
    nome: 'Leg Press unilateral',
    obs: 'Empurrar sem travar o joelho',
    series: 3,
    reps: '10',
    carga: '15 kg',
    progressao: 'legPress',
    descanso: '90s',
    descansoSegundos: 90,
    gif: gifFor('Leg Press unilateral')
  },
  {
    id: 'afundo',
    nome: 'Afundo',
    obs: 'Passo curto e controle total',
    series: 3,
    reps: '10/cada',
    carga: '4 kg/lado',
    progressao: 'afundo',
    descanso: '60-90s',
    descansoSegundos: 75,
    gif: gifFor('Afundo')
  },
  {
    id: 'stiff',
    nome: 'Stiff',
    obs: 'Quadril para tras e coluna reta',
    series: 3,
    reps: '10',
    carga: '25 kg',
    progressao: 'stiff',
    descanso: '90s',
    descansoSegundos: 90,
    gif: gifFor('Stiff')
  },
  {
    id: 'adutora-a',
    nome: 'Adutora',
    obs: 'Movimento lento',
    series: 3,
    reps: '15',
    carga: '25 kg',
    progressao: 'adutora',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Adutora')
  },
  {
    id: 'supino-maquina',
    nome: 'Supino maquina',
    obs: 'Controle total',
    series: 3,
    reps: '10-12',
    carga: '25-35 kg',
    descanso: '60-90s',
    descansoSegundos: 75,
    gif: gifFor('Supino maquina')
  },
  {
    id: 'puxador-frente',
    nome: 'Puxador frente',
    obs: 'Puxar até o peito',
    series: 3,
    reps: '10-12',
    carga: '25-35 kg',
    descanso: '60-90s',
    descansoSegundos: 75,
    gif: gifFor('Puxador frente')
  },
  {
    id: 'desenvolvimento-maquina',
    nome: 'Desenvolvimento maquina',
    obs: 'Sem travar cotovelo',
    series: 3,
    reps: '10',
    carga: '15-25 kg',
    descanso: '60-90s',
    descansoSegundos: 75,
    gif: gifFor('Desenvolvimento maquina')
  },
  {
    id: 'prancha-a',
    nome: 'Prancha',
    obs: 'Corpo reto',
    series: 3,
    reps: '30s',
    carga: 'Peso corporal',
    descanso: '30-45s',
    descansoSegundos: 40,
    gif: gifFor('Prancha')
  }
];

const treinoB = [
  {
    id: 'extensora-unilateral',
    nome: 'Extensora unilateral',
    obs: 'Descida lenta',
    series: 3,
    reps: '15',
    carga: '15 kg',
    progressao: 'extensora',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Extensora unilateral')
  },
  {
    id: 'step-up-leve',
    nome: 'Step-up leve',
    obs: 'Controle',
    series: 2,
    reps: '10',
    carga: 'Sem peso',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Step-up leve')
  },
  {
    id: 'afundo-leve',
    nome: 'Afundo leve',
    obs: 'Leve',
    series: 2,
    reps: '10',
    carga: '0-2 kg',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Afundo leve')
  },
  {
    id: 'adutora-b',
    nome: 'Adutora',
    obs: 'Movimento lento',
    series: 3,
    reps: '15',
    carga: '25 kg',
    progressao: 'adutora',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Adutora')
  },
  {
    id: 'abdutora',
    nome: 'Abdutora',
    obs: 'Controle',
    series: 3,
    reps: '12',
    carga: '35 kg',
    progressao: 'abdutora',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Abdutora')
  },
  {
    id: 'panturrilha',
    nome: 'Panturrilha',
    obs: 'Movimento completo',
    series: 3,
    reps: '12',
    carga: '20-30 kg',
    progressao: 'panturrilha',
    descanso: '45-60s',
    descansoSegundos: 55,
    gif: gifFor('Panturrilha')
  },
  {
    id: 'supino-leve',
    nome: 'Supino leve',
    obs: 'Controle',
    series: 2,
    reps: '12',
    carga: '20-25 kg',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Supino leve')
  },
  {
    id: 'remada',
    nome: 'Remada',
    obs: 'Controle',
    series: 2,
    reps: '12',
    carga: '20-30 kg',
    descanso: '60s',
    descansoSegundos: 60,
    gif: gifFor('Remada')
  },
  {
    id: 'prancha-b',
    nome: 'Prancha',
    obs: 'Corpo reto',
    series: 2,
    reps: '30s',
    carga: 'Peso corporal',
    descanso: '30-45s',
    descansoSegundos: 40,
    gif: gifFor('Prancha')
  }
];

const mobilidadeBase = [
  { id: 'mobilidade-respiracao', grupo: 'Respiracao', nome: 'Respiracao diafragmatica', descricao: 'Respire pelo nariz, expandindo abdome e costelas, sem elevar os ombros.', tempo: '3 min', gif: gifFor('Respiracao diafragmatica') },
  { id: 'mobilidade-cat-camel', grupo: 'Mobilidade', nome: 'Cat-Camel', descricao: 'Alterne arredondar e estender a coluna lentamente.', tempo: '2x10', gif: gifFor('Cat-Camel') },
  { id: 'mobilidade-quadril', grupo: 'Mobilidade', nome: 'Mobilidade de quadril', descricao: 'Mova o quadril com amplitude confortável, sem provocar a virilha.', tempo: '2x10 cada lado', gif: gifFor('Mobilidade de quadril') },
  { id: 'mobilidade-flexor-quadril', grupo: 'Mobilidade', nome: 'Alongamento flexor quadril', descricao: 'Alongue a frente do quadril sem arquear a lombar.', tempo: '30s cada lado', gif: gifFor('Alongamento flexor quadril') },
  { id: 'mobilidade-rotacao-toracica', grupo: 'Mobilidade', nome: 'Rotacao toracica', descricao: 'Gire o tronco lentamente, mantendo quadril e joelhos estaveis.', tempo: '2x10', gif: gifFor('Rotacao toracica') },
  { id: 'mobilidade-ponte-gluteo', grupo: 'Estabilidade', nome: 'Ponte de gluteo', descricao: 'Eleve o quadril contraindo gluteos, sem compensar na lombar.', tempo: '3x12', gif: gifFor('Ponte de gluteo') },
  { id: 'mobilidade-ponte-unilateral', grupo: 'Estabilidade', nome: 'Ponte unilateral', descricao: 'Mantenha a pelve nivelada e eleve o quadril usando uma perna.', tempo: '3x10 cada lado', gif: gifFor('Ponte unilateral') },
  { id: 'mobilidade-dead-bug', grupo: 'Estabilidade', nome: 'Dead Bug', descricao: 'Mantenha lombar estavel e mova braco e perna opostos.', tempo: '3x10', gif: gifFor('Dead Bug') },
  { id: 'mobilidade-bird-dog', grupo: 'Estabilidade', nome: 'Bird Dog', descricao: 'Estenda braco e perna opostos sem rodar o quadril.', tempo: '3x10 cada lado', gif: gifFor('Bird Dog') },
  { id: 'mobilidade-clamshell', grupo: 'Estabilidade', nome: 'Clamshell', descricao: 'Abra o joelho mantendo pes juntos e quadril parado.', tempo: '3x12', gif: gifFor('Clamshell') },
  { id: 'mobilidade-prancha-lateral', grupo: 'Virilha / Adutores', nome: 'Prancha lateral', descricao: 'Mantenha corpo alinhado e pelve firme, sem afundar o quadril.', tempo: '2x20-30s cada lado', gif: gifFor('Prancha lateral') },
  { id: 'mobilidade-copenhagen', grupo: 'Virilha / Adutores', nome: 'Copenhagen leve', descricao: 'Use apoio curto e mantenha a contracao confortavel nos adutores.', tempo: '2x15s cada lado', gif: gifFor('Copenhagen leve') },
  { id: 'mobilidade-isometria-adutor', grupo: 'Virilha / Adutores', nome: 'Isometria de adutor', descricao: 'Aperte uma almofada entre os joelhos sem provocar dor na virilha.', tempo: '3x20-30s', gif: gifFor('Isometria de adutor') },
  { id: 'mobilidade-extensao-joelho', grupo: 'Virilha / Adutores', nome: 'Extensao de joelho sentado', descricao: 'Estenda o joelho com controle e desca lentamente.', tempo: '2x15', gif: gifFor('Extensao de joelho sentado') },
  { id: 'mobilidade-step-up-leve', grupo: 'Virilha / Adutores', nome: 'Step-up leve', descricao: 'Suba no apoio baixo e desca com controle, sem impulso.', tempo: '2x10', gif: gifFor('Step-up leve') }
];

const mobilidadeA = mobilidadeBase.map(item => ({ ...item, id: `${item.id}-a` }));
const mobilidadeB = mobilidadeBase.map(item => ({ ...item, id: `${item.id}-b` }));
const mobilidade = [...mobilidadeA, ...mobilidadeB];

const progressaoSemanal = [
  { semana: 'Semana 1', legPress: '15 kg', stiff: '25 kg', stepUp: 'Peso corporal', afundo: '4 kg/lado', extensora: '15 kg', adutora: '25 kg', abdutora: '35 kg', panturrilha: '20-30 kg' },
  { semana: 'Semana 2', legPress: '20 kg', stiff: '30 kg', stepUp: 'Peso corporal', afundo: '4 kg/lado', extensora: '15 kg', adutora: '25 kg', abdutora: '35 kg', panturrilha: '25-35 kg' },
  { semana: 'Semana 3', legPress: '25 kg', stiff: '35 kg', stepUp: '+2 kg', afundo: '4 kg/lado', extensora: '15 kg', adutora: '25 kg', abdutora: '35 kg', panturrilha: '30-40 kg' },
  { semana: 'Semana 4', legPress: '25 kg', stiff: '35 kg', stepUp: '+2 kg', afundo: '4 kg/lado', extensora: '15 kg', adutora: '25 kg', abdutora: '35 kg', panturrilha: '30-40 kg' }
];

const alongamentos = [
  {
    id: 'alongamento-quadriceps',
    nome: 'Quadríceps',
    descricao: 'Em pe, segure o tornozelo atras do corpo mantendo os joelhos alinhados.',
    ondeSentir: 'Frente da coxa',
    erros: 'Arquear lombar ou puxar forte demais.',
    tempo: '30s cada lado',
    gif: gifFor('Quadríceps')
  },
  {
    id: 'alongamento-posterior',
    nome: 'Posterior',
    descricao: 'Em pe, estenda uma perna a frente e incline o tronco com a coluna neutra.',
    ondeSentir: 'Parte posterior da coxa',
    erros: 'Arredondar a lombar ou forçar o joelho.',
    tempo: '30s cada lado',
    gif: gifFor('Posterior')
  },
  {
    id: 'alongamento-adutor',
    nome: 'Adutores',
    descricao: 'Afaste as pernas e desloque o quadril para um lado, mantendo a outra perna estendida.',
    ondeSentir: 'Parte interna da coxa',
    erros: 'Abrir demais ou continuar se houver dor na virilha.',
    tempo: '30s cada lado',
    gif: gifFor('Adutores')
  },
  {
    id: 'alongamento-panturrilha',
    nome: 'Panturrilha',
    descricao: 'Apoie as maos na parede e mantenha o calcanhar de tras no chao.',
    ondeSentir: 'Panturrilha',
    erros: 'Tirar o calcanhar do chao.',
    tempo: '30s cada lado',
    gif: gifFor('Panturrilha')
  }
];
