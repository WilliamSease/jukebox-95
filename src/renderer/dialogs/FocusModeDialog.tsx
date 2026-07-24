import { isNil } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { Button, TextInput, Toolbar } from 'react95';
import { formatMs } from '../functions/formatFunctions';
import { FlexColumn, FlexRow } from '../sdk/FlexElements';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import Label from '../sdk/Label';
import { GlobalReducer } from '../hooks/useGlobalState';

type IProps = {
  global: GlobalReducer;
};
export const FocusModeDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const nowPlaying = {};
  const playbackState = {};
  const nowPlayingImage = {};

  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const nextCaptcha = useCallback(() => {
    //no i j k I J K
    const characters = 'ABCDEFGHKMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz';
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
      height={800}
      width={800}
      isOpen={state.windowOpen.focus}
      onClose={() => {
        if (isNil(captcha)) nextCaptcha();
      }}
      screenSaverBackground
      provideCloseButton
    >
      {isNil(captcha) ? (
        <FlexColumn style={{ justifyContent: 'center', flexGrow: 1 }}>
          {!isNil(nowPlaying) && !isNil(nowPlayingImage) ? (
            <>
              <FlexRow style={{ justifyContent: 'center' }}>
                <img style={{ height: 365, width: 365 }} src={''} />
              </FlexRow>
              <FlexRow style={{ justifyContent: 'center' }}>
                <Label>{'TRACKPLACEHOLDER'}</Label>
              </FlexRow>
              <FlexRow style={{ justifyContent: 'center' }}>
                <Label>{'ALBUMPLACEHOLDER'}</Label>
              </FlexRow>
              <FlexRow style={{ justifyContent: 'center' }}>
                <Label>{'TRACKPLACEHOLDER'}</Label>
              </FlexRow>
              <FlexRow style={{ justifyContent: 'center' }}>
                {formatMs(0)}
                {' / '}
                {formatMs(0)}
              </FlexRow>
            </>
          ) : (
            <FlexRow style={{ justifyContent: 'center' }}>
              <div>Nothing playing</div>
            </FlexRow>
          )}
        </FlexColumn>
      ) : (
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
              onChange={(v) => setCaptchaInput(v.target.value)}
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
