import { safeStorage } from 'electron';
import type Store from 'electron-store' with { 'resolution-mode': 'import' };

interface SubsonicCreds {
  url: string;
  username: string;
  passwordEncrypted: string;
}

interface AppSettings {
  remember: boolean;
  subsonic: SubsonicCreds | null;
  theme: string | null;
  volume: number;
  preCacheSongs:boolean,
}

const defaults: AppSettings = {
  remember: false,
  subsonic: null,
  theme: null,
  volume: 0.8,
  preCacheSongs: false
};

let store: Store<AppSettings> | null = null;

async function getStore(): Promise<Store<AppSettings>> {
  if (!store) {
    const { default: StoreClass } = await import('electron-store');
    store = new StoreClass<AppSettings>({ defaults });
  }
  return store;
}

// --- Subsonic creds (encrypted at rest) ---

export async function saveSubsonicCreds(url: string, username: string, password: string) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is not available on this machine');
  }
  const passwordEncrypted = safeStorage.encryptString(password).toString('base64');
  const s = await getStore();
  s.set('subsonic', { url, username, passwordEncrypted });
  s.set('remember', true);
}

export async function loadSubsonicCreds() {
  const s = await getStore();
  const saved = s.get('subsonic');
  if (!saved) return null;
  const password = safeStorage.decryptString(Buffer.from(saved.passwordEncrypted, 'base64'));
  return { url: saved.url, username: saved.username, password };
}

export async function clearSubsonicCreds() {
  const s = await getStore();
  s.set('subsonic', null);
  s.set('remember', false);
}

export async function getRemember() {
  const s = await getStore();
  return s.get('remember');
}

// --- Generic settings ---

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const s = await getStore();
  return s.get(key);
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  const s = await getStore();
  s.set(key, value);
}

export async function getAllSettings(): Promise<AppSettings> {
  const s = await getStore();
  return s.store;
}