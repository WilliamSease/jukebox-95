import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.ogg',
  '.m4a',
  '.wav',
  '.opus',
  '.aac',
  '.wma',
]);

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  opus: 'audio/opus',
  aac: 'audio/aac',
};

// music-metadata's `duration: true` option "parses the whole media file if
// required to determine the duration" — fine for a normal track, but for a
// multi-hour continuous recording without a fast lookup header, that means
// actually scanning hundreds of MB of frames sequentially. Past this size,
// skip requesting duration at scan time entirely; usePlayerEngine already
// fills in the real duration from the <audio> element once the track plays.
const DURATION_SCAN_SIZE_LIMIT_BYTES = 50 * 1024 * 1024; // 50MB

// Held module-level, same pattern as subsonic.ts's `credentials` — set once
// when the user picks a folder, used afterward to resolve relative paths
// back to real files on disk.
let libraryRoot: string | null = null;

export function setLibraryRoot(root: string) {
  libraryRoot = root;
}

function getLibraryRoot(): string {
  if (!libraryRoot)
    throw new Error('Local library root not set — call scanLocalLibrary first');
  return libraryRoot;
}

/** Stable id derived from the file's path relative to the library root, so
 *  ids stay consistent across rescans as long as the folder structure doesn't change. */
function localId(relativePath: string): string {
  return `local:${createHash('sha1').update(relativePath).digest('hex')}`;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function scanLocalLibrary(
  rootDir: string,
  onProgress?: (current: number, total: number) => void,
): Promise<Child[]> {
  setLibraryRoot(rootDir);

  const filePaths = await walk(rootDir);
  const Childs: Child[] = [];

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    const relativePath = path.relative(rootDir, filePath); // this is what LibraryTree splits into folders

    try {
      const stats = await stat(filePath);
      const wantDuration = stats.size <= DURATION_SCAN_SIZE_LIMIT_BYTES;

      // Defense in depth: even with the size heuristic above, some other
      // pathological file (corrupt frame headers, etc.) could still hang.
      // This doesn't truly cancel the underlying parse — music-metadata has
      // no cancellation support — it just stops the SCAN from waiting on it
      // forever, so the rest of the library still loads. The abandoned parse
      // may keep running in the background briefly; that's an accepted
      // tradeoff for scan robustness, not a full fix for that one file.
      //
      // skipCovers: true here is deliberate — decoding and holding embedded
      // art for all 30k files at once is exactly what runs the heap out of
      // memory. Art is resolved separately, on demand, only for whichever
      // track is actually nowPlaying (see fetchLocalCoverArt below).
      const parseFile = (await import('music-metadata')).parseFile;
      const metadata = await Promise.race([
        await parseFile(filePath, { duration: wantDuration }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Parse timed out')), 8000),
        ),
      ]);
      const { common, format } = metadata;

      Childs.push({
        id: localId(relativePath),
        title: common.title ?? path.basename(filePath, path.extname(filePath)),
        displayAlbumArtist: common.artist,
        albumArtists: [{ name: common.artist }],
        artist: common.artist,
        album: common.album,
        track: common.track?.no ?? undefined,
        discNumber: common.disk?.no ?? undefined,
        year: common.year,
        genre: common.genre?.[0],
        duration: format.duration, // undefined for large files — filled in at playback time
        path: relativePath,
        isDir: false,
        suffix: path.extname(filePath).slice(1),
      } as Child);
    } catch (err) {
      // unreadable/corrupt/timed-out file — skip it rather than aborting the whole scan
      console.warn(
        `Skipping "${relativePath}": ${err instanceof Error ? err.message : err}`,
      );
    }

    onProgress?.(i + 1, filePaths.length);
  }

  return Childs;
}

export async function fetchLocalFileBlob(relativePath: string) {
  const fullPath = path.join(getLibraryRoot(), relativePath);
  const buffer = await readFile(fullPath);
  const ext = path.extname(fullPath).slice(1).toLowerCase();

  return {
    // structured-clone-friendly ArrayBuffer, same shape fetchStreamBlob already returns
    buffer: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    contentType: CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream',
  };
}

/**
 * Resolves cover art for ONE track, on demand — called only when that track
 * becomes nowPlaying, mirroring how Subsonic's getCoverArtUrl is resolved
 * per-track rather than for the whole library up front. duration: false
 * keeps this fast even for the huge-file case, since we only want the tags.
 */
export async function fetchLocalCoverArt(
  relativePath: string,
): Promise<string | null> {
  const fullPath = path.join(getLibraryRoot(), relativePath);
  const parseFile = (await import('music-metadata')).parseFile;

  const metadata = await parseFile(fullPath, {
    duration: false,
    skipCovers: false,
  });
  const picture = metadata.common.picture?.[0];
  if (!picture) return null;
  return `data:${picture.format};base64,${Buffer.from(picture.data).toString('base64')}`;
}
