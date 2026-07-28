import { useEffect, useMemo, useState } from 'react';
import { Button, Frame, Hourglass, ScrollView, Tab, Tabs } from 'react95';

import './LibraryTree.css';
import { GlobalReducer, GlobalState } from '../../hooks/useGlobalState';
import { getAllSongs } from '../../api/helperFunctions';
import { Folder, useLibraryTree } from './useLibraryTreeResult';
import { isNil } from 'lodash';
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
      </div>
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
            {isNil(tree) && !loading ? (
              <div>Rebuild Tree!</div>
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
              !isNil(tree) && (
                <TreeView<Folder>
                  getKey={(toGet) => toGet.path}
                  defaultExpanded={[tree.id]}
                  tree={[tree]}
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

                  onNodeToggle={(event) => {}}
                />
              )
            )}
          </ScrollView>
        </Frame>
      </div>
    </div>
  );
};
