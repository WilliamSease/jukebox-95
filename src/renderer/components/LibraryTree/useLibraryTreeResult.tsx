import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };

import {
  saveLibraryCache,
  loadLibraryCache,
  getLibraryCacheMeta,
  clearLibraryCache,
} from './library-cache';
import { TreeLeaf } from 'react95';
import { isNil } from 'lodash';

export type Folder = {
  name: string;
  path: string;
  songs: Child[];
};

export interface UseLibraryTreeResult {
  tree: TreeLeaf<Folder> | null;
  isReady: boolean;
  /** true during initial cache hydration, or while initialize() is running */
  isLoading: boolean;
  error: Error | null;
  /** when the currently-loaded tree's underlying song list was last saved, if from cache */
  cachedAt: number | null;

  /** Rebuild from a brand-new batch of songs, and persist it for next launch */
  initialize: (newSongs: Child[]) => Promise<void>;
  /** Wipe the cache and reset in-memory state — forces a fresh initialize() next time */
  clearCache: () => Promise<void>;

  identifyNode: (folder: Folder) => TreeLeaf<Folder> | null;
  getAllSongsRecursive: (node: TreeLeaf<Folder>) => Child[];
  getAllFoldersRecursive: (node: TreeLeaf<Folder>) => Folder[];

  count: number;
}

export function useLibraryTree(subsonic: boolean): UseLibraryTreeResult {
  const [tree, setTree] = useState<TreeLeaf<Folder> | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true: attempting cache hydration
  const [error, setError] = useState<Error | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  const hydrated = useRef(false);

  const buildLibraryTree = useCallback((songs: Child[], subsonic: boolean) => {
    songs.sort((a, b) => (a.path ?? '').localeCompare(b.path ?? '') ?? 0);

    const root = {
      disabled: false,
      icon: <div>📁</div>,
      id: { name: '[root]', path: '[root]', songs: [] } as Folder,
      items: [],
      label: '[root]',
    } as TreeLeaf<Folder>;

    const insert = (next: Child) => {
      const path = next.path ?? '/[orphan]';
      const splitPath = path.split('/').slice(subsonic ? 1 : 0);
      let walker = root;
      for (
        let i = subsonic ? 1 : 0 /** subsonic api includes root in path */;
        i < splitPath.length;
        i++
      ) {
        if (i === splitPath.length - 1) {
          walker.id.songs.push(next);
          setCount((prev) => prev + 1);
        } else {
          const nextPath = splitPath[i];
          const nextIdx = walker.items?.findIndex(
            (leaf) => leaf.label === nextPath,
          );
          if (!isNil(nextIdx) && nextIdx !== -1) {
            walker = walker.items![nextIdx];
          } else {
            walker.items?.push({
              disabled: false,
              icon: <div>📁</div>,
              id: {
                name: nextPath,
                path: splitPath.slice(0, i).concat(nextPath).join('/'),
                songs: [],
              } as Folder,
              items: [],
              label: nextPath,
            } as TreeLeaf<Folder>);
            walker = walker.items![walker.items!.length - 1];
          }
        }
      }
    };

    songs.forEach(insert);

    return root.items?.length === 1 ? root.items[0] : root;
  }, []);

  // Try to hydrate from IndexedDB on mount, so the user isn't re-downloading
  // and rebuilding on every launch.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    (async () => {
      try {
        const [cachedSongs, meta] = await Promise.all([
          loadLibraryCache(subsonic),
          getLibraryCacheMeta(subsonic),
        ]);
        if (cachedSongs && cachedSongs.length > 0) {
          setTree(buildLibraryTree(cachedSongs, subsonic));
          setCachedAt(meta?.savedAt ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const initialize = useCallback(
    async (newSongs: Child[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const newTree = buildLibraryTree(newSongs, subsonic);
        setTree(newTree);
        setCachedAt(Date.now());
        await saveLibraryCache(newSongs, subsonic);
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        throw wrapped;
      } finally {
        setIsLoading(false);
      }
    },
    [subsonic],
  );

  const clearCache = useCallback(async () => {
    await clearLibraryCache();
    setTree(null);
    setCachedAt(null);
  }, []);

  const identifyNode = useCallback(
    (folder: Folder) => {
      if (isNil(tree)) return null;
      const splitPath = folder.path.split('/');
      let walker = tree;
      for (let i = 0; i < splitPath.length; i++) {
        const nextPath = splitPath[i];
        const nextIdx = walker.items?.findIndex(
          (leaf) => leaf.label === nextPath,
        );
        if (!isNil(nextIdx) && nextIdx !== -1) {
          walker = walker.items![nextIdx];
        }
      }
      return walker;
    },
    [tree],
  );

  const getAllSongsRecursive = useCallback((node: TreeLeaf<Folder>) => {
    const out: Child[] = [];
    out.push(...(node.id.songs ?? []));
    node.items?.forEach((child) => out.push(...getAllSongsRecursive(child)));
    return out;
  }, []);

  const getAllFoldersRecursive = useCallback((node: TreeLeaf<Folder>) => {
    const out: Folder[] = [node.id];
    out.push(...(node.items?.map((tl) => tl.id) ?? []));
    node.items?.forEach((child) => out.push(...getAllFoldersRecursive(child)));
    return out;
  }, []);

  return {
    tree,
    isReady: tree !== null,
    isLoading,
    error,
    cachedAt,
    initialize,
    identifyNode,
    clearCache,
    getAllSongsRecursive,
    getAllFoldersRecursive,
    count,
  };
}
