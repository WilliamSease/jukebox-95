// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'quitButton'
| 'minimizeButton' ;



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
  init: (creds: SubsonicCredentials) => ipcRenderer.invoke('subsonic:init', creds),
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
  loadSubsonicCreds: (): Promise<{ url: string; username: string; password: string } | null> =>
    ipcRenderer.invoke('settings:loadSubsonicCreds'),
  clearSubsonicCreds: () => ipcRenderer.invoke('settings:clearSubsonicCreds'),
  getRemember: (): Promise<boolean> => ipcRenderer.invoke('settings:getRemember'),
  get: <T = unknown>(key: string): Promise<T> => ipcRenderer.invoke('settings:get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
};

contextBridge.exposeInMainWorld('settings', settingsBridge);

export type SettingsBridge = typeof settingsBridge;
