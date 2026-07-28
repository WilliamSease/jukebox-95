import { ipcMain, dialog } from 'electron';
import {
  scanLocalLibrary,
  fetchLocalFileBlob,
  fetchLocalCoverArt,
  setLibraryRoot,
} from './local';

export function registerLocalLibraryHandlers() {
  ipcMain.handle('library:pickFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('library:scan', async (event, rootDir: string) => {
    return scanLocalLibrary(rootDir, (current, total) => {
      // pushed to renderer rather than returned, since a full scan can take
      // a while — mirrors the progress-callback pattern your existing
      // getAllSongs already uses for the Subsonic side.
      event.sender.send('library:scanProgress', { current, total });
    });
  });

  ipcMain.handle('library:setLibraryRoot', async (_event, rootDir: string) => {
    return setLibraryRoot(rootDir);
  });

  ipcMain.handle(
    'library:fetchFileBlob',
    async (_event, relativePath: string) => {
      return fetchLocalFileBlob(relativePath);
    },
  );

  ipcMain.handle(
    'library:fetchCoverArt',
    async (_event, relativePath: string) => {
      return fetchLocalCoverArt(relativePath);
    },
  );
}
