// Olympus Cloud Sync v1 — navegador. Código compartilhado, arquivos cifrados ponta a ponta.
// O código de recuperação de 256 bits nunca é enviado ao servidor nem gravado em localStorage.
const DB_NAME = 'olympus-cloud-sync-v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_CIPHER_LENGTH = 1_800_000;
const CODE_RE = /^[0-9a-f]{64}$/;

function hex(bytes) {
  return Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
}
function normalCode(code) {
  const value = String(code || '').replace(/[\s-]/g, '').toLowerCase();
  if (!CODE_RE.test(value)) throw new Error('Código de recuperação inválido. Use os 64 caracteres.');
  return value;
}
async function hash(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
function base64(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 0x4000) {
    result += String.fromCharCode(...bytes.subarray(i, i + 0x4000));
  }
  return btoa(result);
}
function unbase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, x => x.charCodeAt(0));
}
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('devices');
      db.createObjectStore('backups', { autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Armazenamento de sincronização indisponível.'));
  });
}
async function transaction(store, mode, run) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const op = run(tx.objectStore(store));
      tx.oncomplete = () => resolve(op.result);
      tx.onerror = () => reject(new Error('Não foi possível armazenar a configuração local.'));
      tx.onabort = () => reject(new Error('Transação local interrompida.'));
    });
  } finally { db.close(); }
}
async function loadDevice(app) { return transaction('devices', 'readonly', store => store.get(app)); }
async function saveDevice(app, value) { return transaction('devices', 'readwrite', store => store.put(value, app)); }
async function backup(app, ciphertext, reason) {
  return transaction('backups', 'readwrite', store => store.add({
    app, ciphertext, reason, at: new Date().toISOString(),
  }));
}
async function derive(app, code) {
  const keyHex = await hash('olympus-sync-key-v1:' + app + ':' + code);
  return {
    id: await hash('olympus-sync-id-v1:' + app + ':' + code),
    auth: await hash('olympus-sync-auth-v1:' + app + ':' + code),
    key: await crypto.subtle.importKey('raw', Uint8Array.from(keyHex.match(/../g), x => parseInt(x, 16)),
      { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']),
  };
}
async function encryptData(app, id, key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = encoder.encode('olympus-sync-v1:' + app + ':' + id);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad }, key,
    encoder.encode(JSON.stringify({ schema: 1, app, data })),
  ));
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, iv.length);
  const result = base64(combined);
  if (result.length > MAX_CIPHER_LENGTH) throw new Error('Dados grandes demais para a sincronização gratuita. Nenhuma cópia foi substituída.');
  return result;
}
async function decryptData(app, id, key, ciphertext) {
  const bytes = unbase64(ciphertext);
  if (bytes.length <= 28 || bytes.length > MAX_CIPHER_LENGTH) throw new Error('Backup cifrado inválido.');
  const iv = bytes.subarray(0, 12);
  const data = bytes.subarray(12);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: encoder.encode('olympus-sync-v1:' + app + ':' + id) },
      key, data,
    );
    const envelope = JSON.parse(decoder.decode(plaintext));
    if (envelope?.schema !== 1 || envelope.app !== app ||
        !envelope.data || typeof envelope.data !== 'object' || Array.isArray(envelope.data)) {
      throw new Error('Formato do backup incompatível.');
    }
    return envelope.data;
  } catch {
    throw new Error('Não foi possível decifrar o backup. Confira o código de recuperação.');
  }
}
async function digest(data) { return hash(JSON.stringify(data)); }

export class OlympusCloudSync {
  constructor({ app, getData, applyData, apiUrl }) {
    if (!['atlas', 'hermes'].includes(app)) throw new Error('Aplicativo inválido.');
    this.app = app;
    this.getData = getData;
    this.applyData = applyData;
    this.apiUrl = apiUrl;
    this.device = null;
    this.running = false;
    this.pending = null;
  }
  async init() {
    this.device = await loadDevice(this.app) || null;
    return Boolean(this.device);
  }
  connected() { return Boolean(this.device); }
  endpoint(id) {
    const url = new URL(this.apiUrl());
    if (url.protocol !== 'https:') throw new Error('A sincronização exige HTTPS.');
    return url.origin + '/sync/v1/' + this.app + '/' + id;
  }
  async request(device, method, body = null, enrollmentPin = '') {
    const headers = { Authorization: 'Bearer ' + device.auth };
    if (body) headers['Content-Type'] = 'application/json';
    if (enrollmentPin) headers['X-Sync-Enroll-Pin'] = enrollmentPin;
    const response = await fetch(this.endpoint(device.id), {
      method, headers, body: body ? JSON.stringify(body) : undefined,
      referrerPolicy: 'no-referrer', cache: 'no-store',
    });
    if (response.status === 404 && method === 'GET') return null;
    if (response.status === 409) {
      const error = new Error('Conflito detectado: há uma versão diferente na nuvem. Seus dados locais foram preservados.');
      error.code = 'CONFLICT';
      throw error;
    }
    if (!response.ok) {
      if (response.status === 503) throw new Error('Sincronização ainda não configurada ou indisponível na Cloudflare.');
      if (response.status === 403 || response.status === 401) throw new Error('Código de ativação ou autorização recusado.');
      if (response.status === 413) throw new Error('Os dados excedem o limite do backup. Não houve alterações na nuvem.');
      throw new Error('Não foi possível sincronizar (HTTP ' + response.status + ').');
    }
    return response.json();
  }
  async create(enrollmentPin) {
    if (this.device) throw new Error('Já existe uma sincronização ativa neste navegador.');
    if (!enrollmentPin) throw new Error('Informe o código de ativação do Worker.');
    const code = hex(crypto.getRandomValues(new Uint8Array(32)));
    const device = { ...(await derive(this.app, code)), revision: 0, lastDigest: null };
    const data = await this.getData();
    const ciphertext = await encryptData(this.app, device.id, device.key, data);
    const response = await this.request(device, 'PUT', { ciphertext, expectedRevision: 0 }, enrollmentPin);
    device.revision = response.revision;
    device.lastDigest = await digest(data);
    await saveDevice(this.app, device);
    this.device = device;
    return code;
  }
  async join(code, { replaceLocal = false } = {}) {
    if (this.device) throw new Error('Este navegador já tem sincronização. Não é possível vincular duas contas sem migração.');
    const device = { ...(await derive(this.app, normalCode(code))), revision: 0, lastDigest: null };
    const remote = await this.request(device, 'GET');
    if (!remote) throw new Error('Cofre não encontrado. Ative a sincronização no primeiro dispositivo antes de conectar este.');
    const payload = await decryptData(this.app, device.id, device.key, remote.ciphertext);
    const local = await this.getData();
    if (!replaceLocal && Object.keys(local).length > 0) {
      const error = new Error('Este dispositivo já tem dados. Exporte uma cópia e confirme a importação antes de substituir.');
      error.code = 'LOCAL_EXISTS';
      throw error;
    }
    await backup(this.app, await encryptData(this.app, device.id, device.key, local), 'antes-de-conectar');
    device.revision = remote.revision;
    device.lastDigest = await digest(payload);
    // Credenciais de acesso persistem antes da importação (Atlas pode recarregar a página).
    await saveDevice(this.app, device);
    this.device = device;
    await this.applyData(payload);
    return { status: 'imported', revision: remote.revision };
  }
  async sync() {
    if (!this.device) return { status: 'disabled' };
    if (this.running) return { status: 'busy' };
    this.running = true;
    try {
      const device = this.device;
      const local = await this.getData();
      const localDigest = await digest(local);
      const remote = await this.request(device, 'GET');
      if (!remote) throw new Error('Cofre remoto removido; nenhuma alteração foi feita.');
      if (remote.revision === device.revision) {
        if (localDigest === device.lastDigest) return { status: 'current', revision: remote.revision };
        const ciphertext = await encryptData(this.app, device.id, device.key, local);
        const result = await this.request(device, 'PUT', {
          ciphertext, expectedRevision: device.revision,
        });
        device.revision = result.revision;
        device.lastDigest = localDigest;
        await saveDevice(this.app, device);
        return { status: 'uploaded', revision: result.revision };
      }
      const data = await decryptData(this.app, device.id, device.key, remote.ciphertext);
      const remoteDigest = await digest(data);
      if (localDigest !== device.lastDigest && localDigest !== remoteDigest) {
        const error = new Error('Ambos os dispositivos possuem alterações. Nada será substituído automaticamente; resolva o conflito em Ajustes.');
        error.code = 'CONFLICT';
        throw error;
      }
      if (localDigest !== remoteDigest) {
        await backup(this.app, await encryptData(this.app, device.id, device.key, local), 'antes-de-receber');
        await this.applyData(data);
      }
      device.revision = remote.revision;
      device.lastDigest = remoteDigest;
      await saveDevice(this.app, device);
      return { status: localDigest === remoteDigest ? 'current' : 'downloaded', revision: remote.revision };
    } finally {
      this.running = false;
    }
  }
  async resolveConflict(preference) {
    if (!this.device || !['local', 'cloud'].includes(preference)) throw new Error('Escolha inválida.');
    if (this.running) throw new Error('Aguarde o término da sincronização.');
    this.running = true;
    try {
      const device = this.device;
      const remote = await this.request(device, 'GET');
      if (!remote) throw new Error('Cofre não encontrado.');
      const local = await this.getData();
      await backup(this.app, await encryptData(this.app, device.id, device.key, local), 'conflito-local');
      await backup(this.app, remote.ciphertext, 'conflito-remoto');
      if (preference === 'cloud') {
        const data = await decryptData(this.app, device.id, device.key, remote.ciphertext);
        await this.applyData(data);
        device.revision = remote.revision;
        device.lastDigest = await digest(data);
      } else {
        const result = await this.request(device, 'PUT', {
          ciphertext: await encryptData(this.app, device.id, device.key, local),
          expectedRevision: remote.revision,
        });
        device.revision = result.revision;
        device.lastDigest = await digest(local);
      }
      await saveDevice(this.app, device);
      return { status: preference === 'cloud' ? 'downloaded' : 'uploaded', revision: device.revision };
    } finally { this.running = false; }
  }
}
