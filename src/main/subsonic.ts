import { randomBytes, createHash } from 'node:crypto';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };

let api: InstanceType<typeof import('subsonic-api', { with: { 'resolution-mode': 'import' } }).SubsonicAPI> | null = null;

export interface SubsonicCredentials {
  url: string;
  username: string;
  password: string;
}

// Kept separately from `api` because the library's internal auth state is
// private (#s) — we need the raw credentials ourselves to build stream/
// cover-art URLs, since this version of the library has no getStreamUrl/
// getCoverArtUrl helpers. stream()/getCoverArt() exist, but they return a
// Promise<Response> from a fetch the library performs itself, not a URL —
// no good for <audio src> / <img src> in the renderer.
let credentials: SubsonicCredentials | null = null;

export async function initSubsonic(creds: SubsonicCredentials) {
  const { SubsonicAPI } = await import('subsonic-api');
  api = new SubsonicAPI({
    url: creds.url,
    auth: { username: creds.username, password: creds.password },
  });
  credentials = creds;
  return api.ping();
}

export function getApi() {
  if (!api) throw new Error('Subsonic API not initialized — call subsonic:init first');
  return api;
}

export function isInitialized() {
  return api !== null;
}

export function resetSubsonic() {
  api = null;
  credentials = null;
}

// --- URL building for binary endpoints (stream, cover art) ---

function baseURL(): string {
  if (!credentials) throw new Error('Subsonic not initialized');
  let url = credentials.url;
  if (!url.startsWith('http')) url = `https://${url}`;
  if (!url.endsWith('/')) url += '/';
  return url;
}

function buildAuthedUrl(endpoint: string, params: Record<string, string | number | undefined>): string {
  if (!credentials) throw new Error('Subsonic not initialized');

  let base = baseURL();
  if (!base.endsWith('rest/')) base += 'rest/';
  const url = new URL(base + endpoint);

  url.searchParams.set('v', '1.16.1');
  url.searchParams.set('c', 'subsonic-player');
  url.searchParams.set('f', 'json');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  // Same token-auth scheme the library uses internally: token = md5(password + salt).
  // Salt/token go in the URL, never the plaintext password — safe to hand this
  // URL straight to the renderer for <audio>/<img> src.
  const salt = randomBytes(8).toString('hex');
  const token = createHash('md5').update(credentials.password + salt).digest('hex');
  url.searchParams.set('u', credentials.username);
  url.searchParams.set('t', token);
  url.searchParams.set('s', salt);

  return url.toString();
}

export function getStreamUrl(id: string): string {
  return buildAuthedUrl('stream.view', { id });
}

export function getCoverArtUrl(id: string, size?: number): string {
  return buildAuthedUrl('getCoverArt.view', { id, size });
}

// --- Song-returning helpers ---

export async function getSong(id: string): Promise<Child> {
  const res = await getApi().getSong({ id });
  return res.song;
}

export async function getRandomSongs(size = 20): Promise<Child[]> {
  const res = await getApi().getRandomSongs({ size });
  return res.randomSongs.song ?? [];
}

export async function searchSongs(query: string, songCount = 20): Promise<Child[]> {
  const res = await getApi().search3({ query, songCount, artistCount: 0, albumCount: 0 });
  return res.searchResult3.song ?? [];
}

export async function getStarredSongs(): Promise<Child[]> {
  const res = await getApi().getStarred2();
  return res.starred2.song ?? [];
}
