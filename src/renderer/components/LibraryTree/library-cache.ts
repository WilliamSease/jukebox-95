import type { Child, } from 'subsonic-api' with { 'resolution-mode': 'import' };
 
// We cache the flat Song[] list, NOT the LibraryTree itself.
// The tree has Maps and circular parent pointers, neither of which
// survive JSON serialization — but rebuilding the tree from the flat
// list is cheap (milliseconds even at 30k songs), so there's no
// downside to treating the song list as the source of truth on disk.
 
const SONGS_KEY = 'subsonic:library-songs';
const META_KEY = 'subsonic:library-meta';
 
export interface LibraryCacheMeta {
  songCount: number;
  savedAt: number;
}
 
// idb-keyval ships ESM-only, which trips TS's CJS/ESM interop check
// (ts(1479)) if imported statically under a commonjs module target.
// Lazy dynamic import + cache the module reference after first load.
let idbKeyvalPromise: Promise<typeof import('idb-keyval', { with: { 'resolution-mode': 'import' } })> | null = null;
 
function getIdb() {
  if (!idbKeyvalPromise) {
    idbKeyvalPromise = import('idb-keyval');
  }
  return idbKeyvalPromise;
}
 
export async function saveLibraryCache(songs: Child[]): Promise<void> {
  const { set } = await getIdb();
  const meta: LibraryCacheMeta = { songCount: songs.length, savedAt: Date.now() };
  await Promise.all([set(SONGS_KEY, songs), set(META_KEY, meta)]);
}
 
export async function loadLibraryCache(): Promise<Child[] | null> {
  const { get } = await getIdb();
  const songs = await get<Child[]>(SONGS_KEY);
  return songs ?? null;
}
 
export async function getLibraryCacheMeta(): Promise<LibraryCacheMeta | null> {
  const { get } = await getIdb();
  const meta = await get<LibraryCacheMeta>(META_KEY);
  return meta ?? null;
}
 
export async function clearLibraryCache(): Promise<void> {
  const { del } = await getIdb();
  await Promise.all([del(SONGS_KEY), del(META_KEY)]);
}