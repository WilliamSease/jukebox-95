import { ipcMain } from 'electron';
import {
  initSubsonic,
  resetSubsonic,
  getApi,
  getStreamUrl,
  getCoverArtUrl,
  fetchStreamBlob,
  SubsonicCredentials,
} from './subsonic';

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

  // FIXED: these no longer call nonexistent api.getStreamUrl/getCoverArtUrl —
  // they call the URL-building functions in subsonic.ts, which are synchronous
  // and don't touch the network at all (they just construct an authenticated URL).
  ipcMain.handle('subsonic:getCoverArtUrl', (_event, id: string, size?: number) => {
    return getCoverArtUrl(id, size);
  });

  ipcMain.handle('subsonic:getStreamUrl', (_event, id: string) => {
    return getStreamUrl(id);
  });

  // Fetches the full track server-side and returns raw bytes — the renderer
  // wraps this in a Blob so playback/analysis never touches a cross-origin
  // URL, sidestepping CORS entirely regardless of server config.
  ipcMain.handle('subsonic:fetchStreamBlob', async (_event, id: string) => {
    return fetchStreamBlob(id);
  });
}