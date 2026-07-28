import { Button, Frame, ScrollView, Slider, Toolbar } from 'react95';

import {
  AlternateGrey,
  ProgrammaticallyBackgroundableSpan,
} from '../sdk/ThemedComponents';
import { FlexColumn } from '../sdk/FlexElements';
import { CSSProperties, useCallback, useMemo, useState } from 'react';
import Label from '../sdk/Label';
import { isNil } from 'lodash';
import { GlobalReducer } from '../hooks/useGlobalState';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };
import { formatTime, UsePlayerEngineResult } from '../hooks/usePlayerEngine';
import { VolumeSlider } from './VolumeSlider';

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

  const calculatedStyles: CSSProperties = useMemo(() => {
    const out = {
      height: '100%',
      width: '100%',
      position: 'absolute',
      display: 'flex',
      backgroundImage: state.visualSettings.showBackgroundImage
        ? `url('${state.visualSettings.backgroundImageBase64}')`
        : undefined,
      backgroundSize: state.visualSettings.backgroundSizeStrategy,
    } as CSSProperties;

    const parsedStringStyles = state.visualSettings.backgroundCustomCSS
      .split(';')
      .reduce((acc, rule) => {
        const [property, value] = rule.split(':');
        if (property && value) {
          // Convert kebab-case (text-align) to camelCase (textAlign)
          const camelCasedProperty = property
            .trim()
            .replace(/-./g, (c) => c[1].toUpperCase());
          //@ts-ignore -- it's fine
          acc[camelCasedProperty] = value.trim();
        }
        return acc;
      }, {});
    return { ...out, ...parsedStringStyles };
  }, [state.visualSettings]);

  return (
    <FlexColumn style={{ flexGrow: 1 }}>
      <Frame variant="field" style={{ flexGrow: 1 }}>
        <ScrollView key={'scrollView'} style={calculatedStyles}>
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
                    solidTextBackground={
                      state.visualSettings.solidTextBackground
                    }
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
                        <ProgrammaticallyBackgroundableSpan
                          solidTextBackgroundOverride={
                            state.visualSettings.solidTextBackgroundOverride
                          }
                          solidTextBackground={
                            state.visualSettings.solidTextBackground
                          }
                          isSelected={i === highlighted}
                        >
                          {formatTime(itm.duration ?? 0)}
                        </ProgrammaticallyBackgroundableSpan>
                      </div>
                      <div style={{ width: '2rem' }}>
                        <ProgrammaticallyBackgroundableSpan
                          solidTextBackgroundOverride={
                            state.visualSettings.solidTextBackgroundOverride
                          }

                          solidTextBackground={
                            state.visualSettings.solidTextBackground
                          }
                          isSelected={i === highlighted}
                        >
                          {'🎵'}{' '}
                        </ProgrammaticallyBackgroundableSpan>
                      </div>
                      <div style={{ width: '25rem' }}>
                        <ProgrammaticallyBackgroundableSpan
                          solidTextBackgroundOverride={
                            state.visualSettings.solidTextBackgroundOverride
                          }

                          solidTextBackground={
                            state.visualSettings.solidTextBackground
                          }
                          isSelected={i === highlighted}
                        >
                          {itm.title}{' '}
                        </ProgrammaticallyBackgroundableSpan>
                      </div>
                      <div style={{ width: '20rem' }}>
                        {compileTrackInfo(itm).map((s, i) =>
                          i % 2 === 0 ? (
                            <ProgrammaticallyBackgroundableSpan
                              solidTextBackgroundOverride={
                                state.visualSettings.solidTextBackgroundOverride
                              }

                              solidTextBackground={
                                state.visualSettings.solidTextBackground
                              }
                              isSelected={i === highlighted}
                            >
                              <Label>{s}</Label>
                            </ProgrammaticallyBackgroundableSpan>
                          ) : (
                            <div>
                              <ProgrammaticallyBackgroundableSpan
                                solidTextBackgroundOverride={
                                  state.visualSettings
                                    .solidTextBackgroundOverride
                                }

                                solidTextBackground={
                                  state.visualSettings.solidTextBackground
                                }
                                isSelected={i === highlighted}
                              >
                                {s}
                              </ProgrammaticallyBackgroundableSpan>
                            </div>
                          ),
                        )}{' '}
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
                        <ProgrammaticallyBackgroundableSpan
                          solidTextBackgroundOverride={
                            state.visualSettings.solidTextBackgroundOverride
                          }

                          solidTextBackground={
                            state.visualSettings.solidTextBackground
                          }
                          isSelected={false}
                        >
                          <Label
                            style={{ paddingLeft: '1rem' }}
                          >{`${compiledTrackInfo[0]} ${`/ ${compiledTrackInfo[1]}`}`}</Label>
                        </ProgrammaticallyBackgroundableSpan>
                      </div>
                    )}
                    <AlternateGrey
                      index={1}
                      isSelected={i === highlighted}
                      solidTextBackground={
                        state.visualSettings.solidTextBackground
                      }
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                      }}
                      onClick={playThisTrack}
                      key={i + 'track'}
                    >
                      <span
                        style={{
                          width: '2rem',
                          justifyContent: 'center',
                          alignItems: 'center',
                          display: 'inline-block',
                        }}
                      >
                        {state.player.nowPlaying?.id === itm.id ? '💿 ' : '  '}
                      </span>
                      <ProgrammaticallyBackgroundableSpan
                        solidTextBackgroundOverride={
                          state.visualSettings.solidTextBackgroundOverride
                        }

                        solidTextBackground={
                          state.visualSettings.solidTextBackground
                        }
                        isSelected={i === highlighted}
                      >
                        <span
                          style={{
                            paddingLeft: '1rem',
                            width: '2rem',
                            display: 'inline-block',
                          }}
                        >
                          {formatTime(itm.duration ?? 0)}
                        </span>
                        <span style={{ paddingLeft: '1rem' }}>{'🎵'}</span>
                        <span
                          style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                        >
                          {itm.title}
                        </span>
                      </ProgrammaticallyBackgroundableSpan>
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
        <VolumeSlider player={player} />
      </Toolbar>
    </FlexColumn>
  );
}
