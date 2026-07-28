import { isNil } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { Button, TextInput, Toolbar } from 'react95';
import { FlexColumn, FlexRow } from '../sdk/FlexElements';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import Label from '../sdk/Label';
import { GlobalReducer } from '../hooks/useGlobalState';
import { formatTime, UsePlayerEngineResult } from '../hooks/usePlayerEngine';

type IProps = {
  global: GlobalReducer;
  player: UsePlayerEngineResult;
};
export const FocusModeDialog = (props: IProps) => {
  const { global, player } = props;
  const [state, dispatch] = global;

  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const nextCaptcha = useCallback(() => {
    //no i j k l I J K L
    const characters = 'ABCDEFGHKMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    setCaptchaInput('');
    setCaptcha(result);
  }, []);

  return (
    <FlexWindowModal
      title={'Focus Mode'}
      height={'100%'}
      width={'100%'}
      isOpen={state.windowOpen.focus}
      onClose={() => {
        if (isNil(captcha)) nextCaptcha();
      }}
      screenSaverBackground
      provideCloseButton
    >
      <FlexColumn style={{ justifyContent: 'center', flexGrow: 1 }}>
        {!isNil(state.player.nowPlaying) && !isNil(player?.albumArtUrl) ? (
          <>
            <FlexRow style={{ justifyContent: 'center' }}>
              <img
                style={{ height: 365, width: 365 }}
                src={player.albumArtUrl}
              />
            </FlexRow>
            <FlexRow style={{ justifyContent: 'center' }}>
              <Label
                children={state.player.nowPlaying.displayAlbumArtist ?? ''}
              />
            </FlexRow>
            <FlexRow style={{ justifyContent: 'center' }}>
              <Label children={state.player.nowPlaying.album ?? ''} />{' '}
            </FlexRow>
            <FlexRow style={{ justifyContent: 'center' }}>
              <Label children={state.player.nowPlaying.title ?? ''} />{' '}
            </FlexRow>
            <FlexRow style={{ justifyContent: 'center' }}>
              {formatTime(player.progress)}
              {' / '}
              {formatTime(player.duration)}
            </FlexRow>
          </>
        ) : (
          <FlexRow style={{ justifyContent: 'center' }}>
            <div>Nothing playing</div>
          </FlexRow>
        )}
      </FlexColumn>

      {!isNil(captcha) && (
        <FlexColumn style={{ justifyContent: 'center', flexGrow: 1 }}>
          <FlexRow style={{ justifyContent: 'center' }}>
            <Label>To Break your focus, Enter:</Label>
          </FlexRow>
          <FlexRow style={{ justifyContent: 'center', fontSize: 24 }}>
            <div>{captcha}</div>
            <Button variant="thin" onClick={() => nextCaptcha()}>
              ↻
            </Button>
          </FlexRow>
          <FlexRow style={{ justifyContent: 'center' }}>
            <TextInput
              value={captchaInput}
              onChange={(v) => setCaptchaInput(v.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter')
                  if (captchaInput === captcha)
                    dispatch({ windowOpen: { focus: false } });
                  else nextCaptcha();
              }}
            />
          </FlexRow>
          <FlexRow style={{ justifyContent: 'center' }}>
            <Toolbar>
              <Button
                disabled={captchaInput !== captcha}
                onClick={() => {
                  setCaptcha(null);
                  dispatch({ windowOpen: { focus: false } });
                }}
              >
                Confirm
              </Button>
              <Button onClick={() => setCaptcha(null)}>Never Mind</Button>
            </Toolbar>
          </FlexRow>
        </FlexColumn>
      )}
    </FlexWindowModal>
  );
};
