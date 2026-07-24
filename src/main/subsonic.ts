import type { SubsonicAPI as SubsonicApiType } from 'subsonic-api' with { 'resolution-mode': 'import' };

let api: SubsonicApiType | null = null;

export interface SubsonicCredentials {
  url: string;
  username: string;
  password: string;
}

export async function initSubsonic({ url, username, password }: SubsonicCredentials) {
  const { SubsonicAPI } = await import('subsonic-api');
  api = new SubsonicAPI({
    url,
    auth: { username, password },
  });
  return api.ping();
}

export function getApi(): SubsonicApiType {
  if (!api) {
    throw new Error('Subsonic API not initialized — call subsonic:init first');
  }
  return api;
}

export function isInitialized() {
  return api !== null;
}

export function resetSubsonic() {
  api = null;
}