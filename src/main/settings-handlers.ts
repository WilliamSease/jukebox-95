import { ipcMain } from 'electron';
import {
  saveSubsonicCreds,
  loadSubsonicCreds,
  clearSubsonicCreds,
  getRemember,
  getSetting,
  setSetting,
} from './settings';

export function registerSettingsHandlers() {
  ipcMain.handle('settings:saveSubsonicCreds', (_e, url: string, username: string, password: string) =>
    saveSubsonicCreds(url, username, password),
  );

  ipcMain.handle('settings:loadSubsonicCreds', () => loadSubsonicCreds());

  ipcMain.handle('settings:clearSubsonicCreds', () => clearSubsonicCreds());

  ipcMain.handle('settings:getRemember', () => getRemember());

  ipcMain.handle('settings:get', (_e, key: string) => getSetting(key as any));

  ipcMain.handle('settings:set', (_e, key: string, value: unknown) => setSetting(key as any, value as any));
}