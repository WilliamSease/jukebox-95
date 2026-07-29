import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Frame,
  Hourglass,
  ScrollView,
  Tab,
  Tabs,
  TextInput,
  TreeLeaf,
} from 'react95';

import './LibraryTree.css';
import { GlobalReducer, GlobalState } from '../../hooks/useGlobalState';
import { getAllSongs } from '../../api/helperFunctions';
import { Folder, useLibraryTree } from './useLibraryTreeResult';
import { isEmpty, isNil } from 'lodash';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };
import { TreeView } from './__TreeView__/CustomTreeView';
import { TryMeDialog } from '../../dialogs/TryMeDialog';

export const LibraryTree = (props: { global: GlobalReducer }) => {
  const [state, dispatch] = props.global;

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    window.localLibrary.onScanProgress((prog) => setProgress(prog.current));
    window.localLibrary.setLibraryRoot(state.libraryPath);
  }, []);

  const {
    initialize,
    tree,
    getAllSongsRecursive,
    getAllFoldersRecursive,
    identifyNode,
  } = useLibraryTree(state.useSubsonic);

  const [selected, setSelected] = useState<Folder>();

  const [filter, setFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const effectiveFilter = useMemo(
    () => (showFilter ? filter : ''),
    [showFilter, filter],
  );

  const [shuffler, setShuffler] = useState(0);
  const shuffledTree = useMemo(() => {
    const shuffled = [...(tree?.items ?? [])];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }

    return { ...tree, items: shuffled } as TreeLeaf<Folder>;
  }, [tree, shuffler]);

  const effectiveTree = useMemo(() => {
    const relevant = state.behaviorSettings.randomizeTree ? shuffledTree : tree;
    if (isNil(relevant)) return null;
    const out = {
      ...relevant,
      items:
        relevant?.items?.filter(
          (tl) =>
            isEmpty(effectiveFilter) ||
            tl.id.path.toLowerCase().includes(effectiveFilter.toLowerCase()),
        ) ?? [],
    } as TreeLeaf<Folder>;
    console.info(out);
    return out;
  }, [
    state.behaviorSettings.randomizeTree,
    shuffledTree,
    tree,
    effectiveFilter,
  ]);

  const treeButton = useCallback(
    () => (
      <Button
        variant="thin"
        style={{ width: '20%' }}
        onClick={() => {
          setLoading(true);
          if (state.useSubsonic)
            getAllSongs(setProgress)
              .then(initialize)
              .catch((err) => dispatch({ ui: { errorMessage: err } }))
              .finally(() => setLoading(false));
          else {
            window.localLibrary
              .scan(state.libraryPath)
              .then(initialize)
              .catch((err) => dispatch({ ui: { errorMessage: err } }))
              .finally(() => setLoading(false));
          }
        }}
      >
        Refresh
      </Button>
    ),
    [state.useSubsonic],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <TryMeDialog
        global={props.global}
        tree={tree}
        getAllSongsRecursive={getAllSongsRecursive}
        getAllFoldersRecursive={getAllFoldersRecursive}
        identifyNode={identifyNode}
      />

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Tabs
          style={{ marginTop: 6, width: '80%' }}
          value={activeTab}
          onChange={setActiveTab}
        >
          <Tab value={0}>Folders</Tab>

          <span style={{ flexGrow: 1 }}></span>
        </Tabs>
        {state.behaviorSettings.randomizeTree && (
          <Button
            variant="thin"
            style={{ width: '20%' }}
            onClick={() => {
              setShuffler((prev) => prev + 1);
            }}
          >
            Shuffle
          </Button>
        )}
        <Button
          variant={showFilter ? 'flat' : 'default'}
          style={{ width: '20%' }}
          onClick={() => {
            setShowFilter((prev) => !prev);
          }}
        >
          Filter
        </Button>
        {!isNil(effectiveTree) && treeButton()}
      </div>
      {showFilter && (
        <div>
          <TextInput
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="filter (top level folders only)"
          />
        </div>
      )}
      <div style={{ flexGrow: 1, display: 'flex' }}>
        <Frame variant="field" style={{ display: 'flex', flexGrow: 1 }}>
          <ScrollView
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              display: 'flex',
            }}
          >
            {isNil(effectiveTree) && !loading ? (
              <>
                <div>Rebuild Tree!</div>
                <div> {isNil(effectiveTree) && treeButton()}</div>
              </>
            ) : loading ? (
              <div
                style={{
                  position: 'relative',
                  top: '50%',
                  left: '48%',
                  width: '50%',
                }}
              >
                <Hourglass size={16} />
                <div>{`${progress} songs...`}</div>
              </div>
            ) : (
              !isNil(effectiveTree) && (
                <TreeView<Folder>
                  getKey={(toGet) => toGet.path}
                  defaultExpanded={[effectiveTree.id]}
                  tree={[effectiveTree]}
                  onNodeSelect={(id, folder) => {
                    if (selected?.path === folder.path) {
                      const node = identifyNode(folder);
                      if (!isNil(node))
                        dispatch({
                          player: {
                            tracksInPlayer: getAllSongsRecursive(node),
                          },
                        });
                    } else {
                      setSelected(folder);
                    }
                  }}
                />
              )
            )}
          </ScrollView>
        </Frame>
      </div>
    </div>
  );
};
