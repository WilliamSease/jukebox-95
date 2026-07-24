import { ipcMain } from 'electron';
import { initSubsonic, getApi, resetSubsonic, SubsonicCredentials } from './subsonic';

// Whitelist of SubsonicApi methods the renderer is allowed to call.
// Add to this as you use more of the API surface.
const ALLOWED_METHODS = new Set([
  'getArtists',
  'getArtist',
  'getAlbum',
  'getAlbumList2',
  'getSong',
  'search3',
  'getPlaylists',
  'getPlaylist',
  'createPlaylist',
  'updatePlaylist',
  'deletePlaylist',
  'star',
  'unstar',
  'getStarred2',
  'scrobble',
  'search2'
]);

export function registerSubsonicHandlers() {
  ipcMain.handle('subsonic:init', async (_event, creds: SubsonicCredentials) => {
    await initSubsonic(creds);
    return true;
  });

  ipcMain.handle('subsonic:logout', () => {
    resetSubsonic();
    return true;
  });

  ipcMain.handle('subsonic:call', async (_event, method: string, args: unknown) => {
    if (!ALLOWED_METHODS.has(method)) {
      throw new Error(`Subsonic method "${method}" is not whitelisted`);
    }
    const api = getApi();
    // @ts-expect-error dynamic dispatch across many method signatures
    return api[method](args);
  });

  // Cover art and stream are special: they're not really "call, get JSON back"
  // — they're media URLs. Build the authenticated URL in main and hand it back.
  ipcMain.handle('subsonic:getCoverArt', (_event, id: string, size?: number) => {
    return getApi().getCoverArt({ id, size });
  });

  ipcMain.handle('subsonic:stream', (_event, id: string) => {
    return getApi().stream({ id });
  });
}