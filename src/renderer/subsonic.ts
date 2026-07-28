import type { Child, SearchResult3,  } from 'subsonic-api' with { 'resolution-mode': 'import' };


export const subsonicClient = {
    init: (url: string, username: string, password: string) =>
      window.subsonic.init({ url, username, password }),
  
    logout: () => window.subsonic.logout(),
  
    getArtists: () => window.subsonic.call('getArtists'),
  
    getArtist: (id: string) => window.subsonic.call('getArtist', { id }),
  
    getAlbum: (id: string) => window.subsonic.call('getAlbum', { id }),
  
    getAlbumList2: (type: string, size = 20) =>
      window.subsonic.call('getAlbumList2', { type, size }),
  
    search: (query: string) =>
      window.subsonic.call('search3', { query }) as Promise<{searchResult3:SearchResult3}> ,

    getSongs:(songCount:number, songOffset:number) => window.subsonic.call('search3', { songCount, songOffset, artistCount:0, albumCount:0 }) as Promise<{searchResult3:SearchResult3}>,
    
    coverArtUrl: (id: string, size?: number) =>
      window.subsonic.getCoverArtUrl(id, size),
  
    streamUrl: (id: string) => window.subsonic.getStreamUrl(id),
  };