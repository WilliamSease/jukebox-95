import { Button, Frame, ScrollView, Slider, Toolbar } from 'react95';

import { formatMs } from '../functions/formatFunctions';
import { AlternateGrey } from '../sdk/ThemedComponents';
import { FlexColumn } from '../sdk/FlexElements';
import { useCallback, useState } from 'react';
import Label from '../sdk/Label';
import { isNil } from 'lodash';
import { GlobalReducer } from '../hooks/useGlobalState';

export function PlayerList(props: { global: GlobalReducer }) {
  const [state, dispatch] = props.global;

  const [highlighted, setHighlighted] = useState<number>(0);
  const compileTrackInfo = useCallback(
    (item: any) => (item.type === 'track' ? [``] : [item.show.name]),
    [],
  );

  return (
    <FlexColumn style={{ flexGrow: 1 }}>
      <Frame variant="field" style={{ flexGrow: 1 }}>
        <ScrollView
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            display: 'flex',
          }}
        >
          {[].map((itm, i) => {
            const compiledTrackInfo = compileTrackInfo(itm);
            const playThisTrack = () => {
              if (i === highlighted) {
                //PLAY IT
              }
              setHighlighted(i);
            };
            return (
              <>
                {state.ui.playerView === 'individual' && (
                  <AlternateGrey
                    index={i}
                    isSelected={i === highlighted}
                    onClick={playThisTrack}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                      }}
                    >
                      <div style={{ width: '3rem' }}>{formatMs(0)}</div>
                      <div style={{ width: '2rem' }}>🎵</div>
                      <div style={{ width: '25rem' }}>{'NAMEPLACEHOLDER'}</div>
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
                        {false ? '💿' : ''}
                      </div>
                    </div>
                  </AlternateGrey>
                )}
                {state.ui.playerView === 'group' && (
                  <>
                    {(i === 0 ||
                      JSON.stringify(compileTrackInfo([][i - 1])) !==
                        JSON.stringify(compileTrackInfo(itm))) && (
                      <div>
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
                    >
                      <div style={{ width: '3rem' }}>{formatMs(0)}</div>
                      <div style={{ width: '2rem' }}>{'🎵'}</div>
                      <div style={{ width: '43rem' }}>{'NAMEPLACEHOLDER'}</div>
                      <div
                        style={{
                          width: '2rem',
                          justifyContent: 'center',
                          alignItems: 'center',
                          display: 'flex',
                        }}
                      >
                        {false ? '💿' : ''}
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
            <span>{'ARTISTNAMEPLACEHOLDER'}</span>

            <Label style={{ marginLeft: '1rem' }}>Album:</Label>
            <span>{'ALBUMNAMEPLACEHOLDER'}</span>

            <Label style={{ marginLeft: '1rem' }}>Name:</Label>
            <span>{'TRACKNAME'}</span>
          </>
        )}
      </Toolbar>
      <Slider
        size={800}
        value={(0 / 0) * 100}
        style={{ marginLeft: '1.4rem', marginBottom: '0' }}
        orientation="horizontal"
        onChangeCommitted={(value) => {}}
      />
      <Toolbar style={{ marginLeft: '1rem' }}>
        <Button
          onClick={() => {
            //PLAY
          }}
          disabled={false}
          className="toolbarButton"
        >
          ⏵
        </Button>
        <Button disabled={false} onClick={() => {}} className="toolbarButton">
          ⏸
        </Button>
        <Button disabled={false} onClick={() => {}} className="toolbarButton">
          ⏹
        </Button>
        <Button disabled={false} onClick={() => {}} className="toolbarButton">
          ⏏
        </Button>
        <Button
          onClick={() => {
            if (0 < 5000) {
            } else {
              //restart track
            }
          }}
          className="toolbarButton"
        >
          ⏮
        </Button>
        <Button onClick={() => {}} className="toolbarButton">
          ⏭
        </Button>
        <Button
          variant={false ? 'flat' : 'default'}
          onClick={() => {}}
          className="toolbarButton"
        >
          Repeat
        </Button>
        <Button
          onClick={() => {}}
          variant={false ? 'flat' : 'default'}
          className="toolbarButton"
        >
          Shuffle
        </Button>
        <Button disabled={false} onClick={() => {}} className="toolbarButton">
          ⏴ 15s
        </Button>
        <Button disabled={false} onClick={() => {}} className="toolbarButton">
          15s ⏵
        </Button>
        <span style={{ marginLeft: '.5rem', marginRight: '.5rem' }}>
          {formatMs(0)} / {formatMs(0)}
        </span>
      </Toolbar>
    </FlexColumn>
  );
}
