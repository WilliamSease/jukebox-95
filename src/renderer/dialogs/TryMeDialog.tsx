import { Frame, ScrollView, TreeLeaf } from 'react95';
import { GlobalReducer } from '../hooks/useGlobalState';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import { Folder } from '../components/LibraryTree/useLibraryTreeResult';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isNil } from 'lodash';
import { formatTime } from '../hooks/usePlayerEngine';

export const TryMeDialog = (props: {
  global: GlobalReducer;
  tree: TreeLeaf<Folder> | null;
  getAllSongsRecursive: (node: TreeLeaf<Folder>) => Child[];
  getAllFoldersRecursive: (node: TreeLeaf<Folder>) => Folder[];
  identifyNode: (folder: Folder) => TreeLeaf<Folder> | null;
}) => {
  const {
    global,
    tree,
    getAllSongsRecursive,
    getAllFoldersRecursive,
    identifyNode,
  } = props;
  const [state, dispatch] = global;

  const flatFolders = useMemo(
    () => (!isNil(tree) ? getAllFoldersRecursive(tree) : null),
    [tree],
  );

  const [offer, setOffer] = useState<{
    folders: Folder[];
    songs: Child[];
  } | null>(null);

  const roll = useCallback(() => {
    if (state.windowOpen.tryMe && !isNil(flatFolders)) {
      const random =
        flatFolders[Math.floor(Math.random() * (flatFolders?.length ?? 0))];
      const node = identifyNode(random);
      if (!isNil(node))
        setOffer({
          folders: getAllFoldersRecursive(node),
          songs: getAllSongsRecursive(node),
        });
    }
  }, [flatFolders, state.windowOpen.tryMe]);

  useEffect(() => {
    if (state.windowOpen.tryMe) {
      roll();
    }
  }, [state.windowOpen.tryMe, roll]);

  return (
    <FlexWindowModal
      title="Try Me"
      isOpen={state.windowOpen.tryMe}
      onClose={() => dispatch({ windowOpen: { tryMe: false } })}
      height={600}
      width={600}
      provideCloseButton
      bottomButtons={[
        {
          text: 'Reroll',
          onPress: roll,
        },
        {
          text: 'Accept',
          onPress: () => {
            if (!isNil(offer?.songs))
              dispatch({
                player: {
                  tracksInPlayer: offer?.songs,
                  nowPlaying: offer?.songs[0],
                },
              });
          },
          closesWindow: true,
          disabled: isNil(offer),
        },
        {
          text: 'Close',
          onPress: () => {},
          closesWindow: true,
        },
      ]}
    >
      {!isNil(offer) ? (
        <div>
          <span style={{ paddingLeft: 10 }}>Will you listen to</span>
          <Frame
            variant="field"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              margin: 10,
            }}
          >
            <ScrollView style={{ height: 400 }}>
              {offer.folders.map((folder) => (
                <div>{folder.path}</div>
              ))}
            </ScrollView>
          </Frame>
          <div style={{ paddingLeft: 10 }}>
            {`${offer.songs.length} songs, 
            ${formatTime(
              offer.songs
                .map((song) => song.duration ?? 0)
                .reduce((accumulator, currentValue) => {
                  return accumulator + currentValue;
                }, 0),
            )}`}
          </div>
        </div>
      ) : (
        <div>No Tree!</div>
      )}
    </FlexWindowModal>
  );
};
