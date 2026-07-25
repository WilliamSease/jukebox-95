import { Button, Frame, ScrollView, Slider, Toolbar } from 'react95';

import { AlternateGrey } from '../sdk/ThemedComponents';
import { FlexColumn } from '../sdk/FlexElements';
import { useCallback, useState } from 'react';
import Label from '../sdk/Label';
import { isNil } from 'lodash';
import { GlobalReducer } from '../hooks/useGlobalState';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };
import { formatTime, UsePlayerEngineResult } from '../hooks/usePlayerEngine';
import { VolumeSlider } from './VolumeSlider';
import { AudioVisualizer } from './AudioVisualizer';

export function PlayerList(props: {
  global: GlobalReducer;
  player: UsePlayerEngineResult;
}) {
  const { player, global } = props;
  const [state, dispatch] = global;

  const [highlighted, setHighlighted] = useState<number>(0);
  const compileTrackInfo = useCallback(
    (item: Child) => [
      `${item.albumArtists?.map((artist) => artist.name)?.join(' ,')}`,
      `${item.album}`,
    ],
    [],
  );

  return (
    <FlexColumn style={{ flexGrow: 1 }}>
      <Frame variant="field" style={{ flexGrow: 1 }}>
        <ScrollView
          key={'scrollView'}
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            display: 'flex',
          }}
        >
          {state.player.tracksInPlayer.map((itm, i) => {
            const compiledTrackInfo = compileTrackInfo(itm);
            const playThisTrack = () => {
              if (i === highlighted) {
                dispatch({
                  player: { nowPlaying: state.player.tracksInPlayer[i] },
                });
              }
              setHighlighted(i);
            };
            return (
              <>
                {state.ui.showTracksIndividually && (
                  <AlternateGrey
                    index={i}
                    isSelected={i === highlighted}
                    onClick={playThisTrack}
                    key={i + 'track'}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                      }}
                    >
                      <div style={{ width: '3rem' }}>
                        {formatTime(itm.duration ?? 0)}
                      </div>
                      <div style={{ width: '2rem' }}>{'🎵'}</div>
                      <div style={{ width: '25rem' }}>{itm.title}</div>
                      <div style={{ width: '20rem' }}>
                        {compileTrackInfo(itm).map((s, i) =>
                          i % 2 === 0 ? <Label>{s}</Label> : <div>{s}</div>,
                        )}
                      </div>
                      <div
                        style={{
                          width: '2rem',
                          justifyContent: 'center',
                          alignItems: 'center',
                          display: 'flex',
                        }}
                      >
                        {state.player.nowPlaying?.id === itm.id ? '💿' : ''}
                      </div>
                    </div>
                  </AlternateGrey>
                )}
                {!state.ui.showTracksIndividually && (
                  <>
                    {(i === 0 ||
                      JSON.stringify(
                        compileTrackInfo(state.player.tracksInPlayer[i - 1]),
                      ) !== JSON.stringify(compileTrackInfo(itm))) && (
                      <div key={i + 'label'}>
                        <Label>{`${compiledTrackInfo[0]} ${`/ ${compiledTrackInfo[1]}`}`}</Label>
                      </div>
                    )}
                    <AlternateGrey
                      index={1}
                      isSelected={i === highlighted}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        marginLeft: '2rem',
                      }}
                      onClick={playThisTrack}
                      key={i + 'track'}
                    >
                      <div style={{ width: '3rem' }}>
                        {formatTime(itm.duration ?? 0)}
                      </div>
                      <div style={{ width: '2rem' }}>{'🎵'}</div>
                      <div style={{ width: '43rem' }}>{itm.title}</div>
                      <div
                        style={{
                          width: '2rem',
                          justifyContent: 'center',
                          alignItems: 'center',
                          display: 'flex',
                        }}
                      >
                        {state.player.nowPlaying?.id === itm.id ? '💿' : ''}
                      </div>
                    </AlternateGrey>
                  </>
                )}
              </>
            );
          })}
        </ScrollView>
      </Frame>

      <Toolbar style={{ justifyItems: 'center' }}>
        {isNil(state.player.nowPlaying) ? (
          `[Nothing Playing]`
        ) : (
          <>
            <Label style={{ marginLeft: '1rem' }}>{`Artist: `}</Label>
            <span>{state.player.nowPlaying.displayAlbumArtist}</span>

            <Label style={{ marginLeft: '1rem' }}>Album:</Label>
            <span>{state.player.nowPlaying.album}</span>

            <Label style={{ marginLeft: '1rem' }}>Name:</Label>
            <span>{state.player.nowPlaying.title}</span>
          </>
        )}
      </Toolbar>
      <Slider
        size={state.ui.leftPanelBigger ? 350 : 800}
        value={
          ((state.player?.progress ?? 0) /
            (state.player.nowPlaying?.duration ?? 0)) *
          100
        }
        style={{ marginLeft: '1.4rem', marginBottom: '0' }}
        orientation="horizontal"
        onChangeCommitted={(value) => {
          player.seek(
            Math.floor(
              ((state.player.nowPlaying?.duration ?? 0) / 100) * value,
            ),
          );
        }}
      />
      <Toolbar style={{ marginLeft: '1rem' }}>
        <Button
          onClick={() => {
            !isNil(state.player.nowPlaying) && player.resume();
          }}
          disabled={player.isPlaying || isNil(state.player.nowPlaying)}
          className="toolbarButton"
        >
          ⏵
        </Button>
        <Button
          disabled={!player.isPlaying}
          onClick={() => {
            if (player.isPlaying) player.pause();
          }}
          className="toolbarButton"
        >
          ⏸
        </Button>
        <Button
          disabled={!player.isPlaying}
          onClick={() => {
            if (player.isPlaying) player.pause();
            player.seek(0);
          }}
          className="toolbarButton"
        >
          ⏹
        </Button>
        <Button
          onClick={() => {
            if (player.isPlaying) player.pause();
            player.seek(0);
            dispatch({
              player: { nowPlaying: null, tracksInPlayer: [] },
            });
          }}
          className="toolbarButton"
        >
          ⏏
        </Button>
        <Button
          onClick={() => {
            if (player.progress < 5) {
              player.previous();
            } else player.seek(0);
          }}
          className="toolbarButton"
        >
          ⏮
        </Button>
        <Button
          onClick={() => {
            player.next();
          }}
          className="toolbarButton"
        >
          ⏭
        </Button>
        <Button
          variant={player.repeat ? 'flat' : 'default'}
          onClick={() => {
            player.toggleRepeat();
          }}
          className="toolbarButton"
        >
          Repeat
        </Button>
        <Button
          onClick={() => {
            player.toggleShuffle();
          }}
          variant={player.shuffle ? 'flat' : 'default'}
          className="toolbarButton"
        >
          Shuffle
        </Button>
        <Button
          disabled={!player.isPlaying}
          onClick={() => {
            if (player.isPlaying) {
              const seek = (player.progress ?? 15) - 15;
              player.seek(seek >= 0 ? seek : 0);
            }
          }}
          className="toolbarButton"
        >
          ⏴ 15s
        </Button>
        <Button
          disabled={!player.isPlaying}
          onClick={() => {
            if (player.isPlaying) {
              let seek = player.progress + 15;
              if (seek > (player.duration ?? 0)) {
                seek = player.duration ?? 0;
              }
              player.seek(seek);
            }
          }}
          className="toolbarButton"
        >
          15s ⏵
        </Button>
        <span style={{ marginLeft: '.5rem', marginRight: '.5rem' }}>
          {formatTime(player.progress)} / {formatTime(player.duration)}
        </span>
        <span style={{ flexGrow: 1 }}></span>
        {state.config.preCacheSongs && (
          <AudioVisualizer analyserRef={player.analyserRef} />
        )}
        <span style={{ marginLeft: '.5rem' }} />
        <VolumeSlider player={player} />
      </Toolbar>
    </FlexColumn>
  );
}
