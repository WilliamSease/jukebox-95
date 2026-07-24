import { isNil } from 'lodash';
import { subsonicClient } from '../subsonic';
import type { Child  } from 'subsonic-api' with { 'resolution-mode': 'import' };

export async function getAllSongs(updateProgress:(current:number) => void) {
    let idx = 0;
    let allSongs = [] as Child[];
    while (true) {
    let firstHit = await subsonicClient.getSongs(100, idx).catch((err) => {throw new Error(err)})
        if (!isNil(firstHit.searchResult3.song)) {
            updateProgress(idx)
            const song = firstHit.searchResult3.song
            allSongs.push(...song)
            idx += song.length
        } else {
            return allSongs
        }
    }
}