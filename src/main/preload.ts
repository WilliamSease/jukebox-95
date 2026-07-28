// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import {
  contextBridge,
  ipcMain,
  ipcRenderer,
  IpcRendererEvent,
} from 'electron';
import type { Child, SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with {
  'resolution-mode': 'import',
};
import { setLibraryRoot } from './local';
export type Channels = 'ipc-example' | 'quitButton' | 'minimizeButton';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;

export interface SubsonicCredentials {
  url: string;
  username: string;
  password: string;
}

const subsonicBridge = {
  init: (creds: SubsonicCredentials) =>
    ipcRenderer.invoke('subsonic:init', creds),
  logout: () => ipcRenderer.invoke('subsonic:logout'),
  call: <T = any>(method: string, args?: unknown): Promise<T> =>
    ipcRenderer.invoke('subsonic:call', method, args),
  getCoverArtUrl: (id: string, size?: number): Promise<string> =>
    ipcRenderer.invoke('subsonic:getCoverArtUrl', id, size),
  getStreamUrl: (id: string): Promise<string> =>
    ipcRenderer.invoke('subsonic:getStreamUrl', id),
};

contextBridge.exposeInMainWorld('subsonic', subsonicBridge);

export type SubsonicBridge = typeof subsonicBridge;

const settingsBridge = {
  saveSubsonicCreds: (url: string, username: string, password: string) =>
    ipcRenderer.invoke('settings:saveSubsonicCreds', url, username, password),
  loadSubsonicCreds: (): Promise<{
    url: string;
    username: string;
    password: string;
  } | null> => ipcRenderer.invoke('settings:loadSubsonicCreds'),
  clearSubsonicCreds: () => ipcRenderer.invoke('settings:clearSubsonicCreds'),
  getRemember: (): Promise<boolean> =>
    ipcRenderer.invoke('settings:getRemember'),
  get: <T = unknown>(key: string): Promise<T> =>
    ipcRenderer.invoke('settings:get', key),
  set: (key: string, value: unknown) =>
    ipcRenderer.invoke('settings:set', key, value),
};

contextBridge.exposeInMainWorld('settings', settingsBridge);

contextBridge.exposeInMainWorld('appInfo', {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
});

export type SettingsBridge = typeof settingsBridge;

const localLibraryBridge = {
  pickFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('library:pickFolder'),
  scan: (rootDir: string): Promise<Child[]> =>
    ipcRenderer.invoke('library:scan', rootDir),
  fetchFileBlob: (
    relativePath: string,
  ): Promise<{ buffer: ArrayBuffer; contentType: string }> =>
    ipcRenderer.invoke('library:fetchFileBlob', relativePath),
  fetchCoverArt: (relativePath: string): Promise<string | null> =>
    ipcRenderer.invoke('library:fetchCoverArt', relativePath),
  // returns an unsubscribe function — call it in a useEffect cleanup
  onScanProgress: (
    cb: (progress: { current: number; total: number }) => void,
  ) => {
    const listener = (
      _e: unknown,
      progress: { current: number; total: number },
    ) => cb(progress);
    ipcRenderer.on('library:scanProgress', listener);
    return () => ipcRenderer.removeListener('library:scanProgress', listener);
  },
  setLibraryRoot: (rootDir: string) =>
    ipcRenderer.invoke('library:setLibraryRoot', rootDir),
};

contextBridge.exposeInMainWorld('localLibrary', localLibraryBridge);

export type LocalLibraryBridge = typeof localLibraryBridge;

// preload.d.ts:
// interface Window {
//   localLibrary: LocalLibraryBridge;
// }
