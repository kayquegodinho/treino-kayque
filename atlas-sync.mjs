// Sincronização Atlas: a interface Android já usa esta mesma página Web.
// O conteúdo de atlasData é cifrado antes de sair do dispositivo.
import { OlympusCloudSync } from './cloud-sync.mjs?v=4.0.4';

const API = 'https://hermes-finance-api.godinhokayque.workers.dev';
const dataset = () => {
  try {
    const value = JSON.parse(localStorage.getItem('atlasData') || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    throw new Error('Dados locais inválidos. Faça um backup antes de sincronizar.');
  }
};
let statusText = 'Sincronização desativada neste dispositivo.';
let timer = null;
let debounce = null;
let statusElement = null;
let syncing = false;
const sync = new OlympusCloudSync({
  app: 'atlas',
  getData: dataset,
  applyData: async data => {
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        (data.days && (typeof data.days !== 'object' || Array.isArray(data.days))) ||
        (data.drafts && (typeof data.drafts !== 'object' || Array.isArray(data.drafts)))) {
      throw new Error('Backup Atlas incompatível. Seus registros foram preservados.');
    }
    localStorage.setItem('atlasData', JSON.stringify(data));
    // Recarregamos somente APÓS registrar a revisão no IndexedDB.
  },
  apiUrl: () => API,
});

const el = (tag, className = '', text = null) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
function inform(message) {
  statusText = String(message);
  if (statusElement) statusElement.textContent = statusText;
}
function toast(message) {
  inform(message);
}
async function syncNow(manual = false) {
  if (!sync.connected() || syncing) return;
  syncing = true;
  try {
    const result = await sync.sync();
    if (result.status === 'uploaded') inform('Alterações salvas com criptografia na nuvem.');
    else if (result.status === 'downloaded') { inform('Registros atualizados. Abrindo a nova versão…'); setTimeout(() => window.location.reload(), 300); }
    else if (manual) inform('Tudo em dia. Nenhuma mudança pendente.');
  } catch (error) {
    inform(error.message);
  } finally { syncing = false; }
}
function ensureAutoSync() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => syncNow(), 60000);
}
function localHasRecords() {
  const local = dataset();
  return Boolean(Object.keys(local.days || {}).length ||
    Object.keys(local.drafts || {}).length ||
    (local.measures || []).length || (local.reviews || []).length ||
    Object.keys(local).some(key => !['days', 'drafts', 'measures', 'reviews'].includes(key)));
}
function setupPanel() {
  const settings = document.getElementById('settings');
  if (!settings) return;
  const box = el('div', 'card settings-fold');
  box.id = 'cloudSyncAtlasCard';
  const details = document.createElement('details');
  const title = el('summary', '', 'Sincronizar com o Olimpo e outros dispositivos');
  const body = el('div', 'settings-body');
  body.append(el('div', 'small', 'O Atlas Android e o Atlas no Olimpo utilizam esta mesma interface. Com a sincronização ativada, registros alterados em um dispositivo são enviados cifrados e atualizados nos demais.'));
  statusElement = el('p', 'small', statusText);
  statusElement.id = 'atlasCloudStatus';
  statusElement.setAttribute('role', 'status');
  body.append(statusElement);

  if (!sync.connected()) {
    body.append(el('p', 'small', 'No primeiro dispositivo: configure a Cloudflare e ative um cofre exclusivo do Atlas.'));
    const pin = el('input');
    pin.type = 'password'; pin.autocomplete = 'off';
    pin.placeholder = 'Código de ativação do Worker';
    pin.setAttribute('aria-label', 'Código de ativação Cloudflare');
    pin.style.cssText = 'width:100%;min-height:44px;padding:12px;margin:9px 0;border-radius:10px';
    const create = el('button', 'btn full', 'Ativar e gerar código de recuperação');
    create.type = 'button';
    const secretOutput = el('div');
    create.addEventListener('click', async () => {
      if (!pin.value.trim()) return toast('Informe o código de ativação da Cloudflare.');
      create.disabled = true;
      try {
        const code = await sync.create(pin.value.trim());
        pin.value = '';
        inform('Ativado. Copie e guarde este código agora; ele não será exibido novamente.');
        const value = el('code', '', code);
        value.style.cssText = 'display:block;overflow-wrap:anywhere;margin:10px 0';
        const copy = el('button', 'btn secondary full', 'Copiar código');
        copy.type = 'button';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(code); inform('Código copiado. Guarde fora do aparelho.'); }
          catch { inform('Não foi possível copiar automaticamente. Selecione o texto.'); }
        });
        const finish = el('button', 'btn full', 'Guardei o código com segurança — concluir');
        finish.type = 'button';
        finish.addEventListener('click', () => {
          if (window.confirm('Confirma que guardou o código de recuperação fora do Atlas? Ele não poderá ser exibido novamente.')) {
            window.location.reload();
          }
        });
        secretOutput.replaceChildren(el('p', 'small', 'CÓDIGO DE RECUPERAÇÃO — copie antes de sair:'), value, copy,
          el('p', 'small', 'Quem possuir este código poderá decifrar seus backups. Não compartilhe.'),
          finish);
        create.hidden = true;
        ensureAutoSync();
      } catch (error) { toast(error.message); }
      finally { create.disabled = false; }
    });
    body.append(pin, create, secretOutput, document.createElement('hr'));
    body.append(el('p', 'small', 'No segundo dispositivo: informe o código de recuperação do primeiro.'));
    const codeInput = el('input');
    codeInput.type = 'password'; codeInput.autocomplete = 'off';
    codeInput.placeholder = 'Código de recuperação de 64 caracteres';
    codeInput.setAttribute('aria-label', 'Código de recuperação');
    codeInput.style.cssText = 'width:100%;min-height:44px;padding:12px;margin:9px 0;border-radius:10px';
    const join = el('button', 'btn secondary full', 'Conectar este dispositivo');
    join.type = 'button';
    join.addEventListener('click', async () => {
      if (localHasRecords() && !window.confirm(
        'Este Atlas já contém registros. Faça primeiro o backup pelo botão “Salvar uma cópia dos meus dados”. A conexão guardará um backup local cifrado e depois importará os registros da nuvem. Continuar?'
      )) return;
      join.disabled = true;
      try {
        await sync.join(codeInput.value, { replaceLocal: true });
        codeInput.value = '';
        inform('Conectado. Seus registros foram recebidos; abrindo Atlas…');
        ensureAutoSync();
        setTimeout(() => window.location.reload(), 300);
      } catch (error) { toast(error.message); }
      finally { join.disabled = false; }
    });
    body.append(codeInput, join);
  } else {
    // Identificação curta derivada do ID do cofre: NÃO é a chave de recuperação,
    // NÃO é o bearer e nunca concede acesso ao cofre. Útil para conferir que
    // computador e celular apontam para a MESMA cópia criptografada.
    const id = sync.device?.id;
    if (/^[0-9a-f]{64}$/.test(id || '')) {
      const fingerprint = id.slice(0, 8) + '-' + id.slice(8, 16);
      const identity = el('p', 'small', 'Identificação do cofre: ' + fingerprint);
      identity.id = 'atlasVaultFingerprint';
      identity.style.cssText = 'overflow-wrap:anywhere;font-weight:700;margin:8px 0';
      body.append(identity);
      body.append(el('p', 'small',
        'Confira se essa identificação é IGUAL no celular e no Olimpo. Ela não é sua chave secreta. Se for diferente, não use “Resolver conflito de dados”.'));
    }
    const upload = el('button', 'btn full', 'Sincronizar agora');
    upload.type = 'button';
    upload.addEventListener('click', () => syncNow(true));
    body.append(upload);
    const conflict = document.createElement('details');
    const header = el('summary', '', 'Resolver conflito de dados');
    const warning = el('p', 'small', 'Se dois dispositivos fizeram mudanças simultâneas, decida qual cópia usar. Ambas serão preservadas como backups locais cifrados.');
    const cloud = el('button', 'btn secondary full', 'Usar registros da nuvem');
    cloud.type = 'button';
    cloud.addEventListener('click', async () => {
      if (!window.confirm('Receber os registros da nuvem, guardando antes cópia cifrada dos registros locais?')) return;
      try { await sync.resolveConflict('cloud'); inform('Registros da nuvem recuperados.'); setTimeout(() => window.location.reload(), 300); }
      catch (error) { toast(error.message); }
    });
    const local = el('button', 'btn secondary full', 'Enviar registros deste dispositivo');
    local.type = 'button';
    local.addEventListener('click', async () => {
      if (!window.confirm('Enviar os registros deste dispositivo e substituir a versão na nuvem? As duas cópias serão guardadas cifradas.')) return;
      try { await sync.resolveConflict('local'); inform('Registros deste dispositivo enviados.'); }
      catch (error) { toast(error.message); }
    });
    conflict.append(header, warning, cloud, local);
    body.append(conflict);
  }
  details.append(title, body);
  box.append(details);
  const update = document.getElementById('manualUpdateCard');
  if (update?.parentElement === settings) update.after(box);
  else settings.prepend(box);
}
async function main() {
  if (!crypto?.subtle || !window.indexedDB) {
    inform('Este navegador não permite criptografia segura; o Atlas continuará funcionando localmente.');
    return;
  }
  try {
    await sync.init();
    inform(sync.connected() ? 'Cofre conectado. Verificando alterações…' : 'Desativada. Seus registros permanecem somente neste dispositivo.');
    setupPanel();
    if (sync.connected()) { ensureAutoSync(); syncNow(); }
  } catch (error) { inform(error.message); setupPanel(); }
}
window.addEventListener('atlas:data-changed', () => {
  if (!sync.connected()) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => syncNow(), 2500);
});
window.addEventListener('focus', () => { if (sync.connected()) syncNow(); });
main();
