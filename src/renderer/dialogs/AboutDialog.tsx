import { Anchor, Frame, ScrollView } from 'react95';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import { logo } from '../images';
import { GlobalReducer } from '../hooks/useGlobalState';
import { useEffect, useState } from 'react';

type IProps = {
  global: GlobalReducer;
};

export const AboutDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const [version, setVersion] = useState('');

  useEffect(() => {
    window.appInfo.getVersion().then(setVersion);
  }, []);

  return (
    <FlexWindowModal
      title={'About'}
      height={450}
      width={500}
      isOpen={state.windowOpen.about}
      onClose={() => dispatch({ windowOpen: { about: false } })}
      provideCloseButton
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img style={{ borderRadius: 300 }} src={logo} />
        <div style={{ marginTop: '.25rem' }}>
          {' '}
          <Anchor
            target={'_blank'}
            href="https://github.com/WilliamSease/jukebox-95"
          >
            Jukebox 95
          </Anchor>{' '}
          {version}
        </div>
        <Anchor target={'_blank'} href="https://williamsease.github.io">
          William Sease
        </Anchor>

        <Anchor target={'_blank'} href="https://react95.io/">
          React95
        </Anchor>
        <Anchor
          target={'_blank'}
          href="https://github.com/explodingcamera/subsonic-api"
        >
          @explodingcamera/subsonic-api
        </Anchor>
        <Anchor
          target={'_blank'}
          href="https://github.com/electron-react-boilerplate/electron-react-boilerplate"
        >
          Electron React Boilerplate
        </Anchor>
      </div>
    </FlexWindowModal>
  );
};

export const TodoDialog = (props: IProps) => {
  const [state, dispatch] = props.global;
  return (
    <FlexWindowModal
      title={'Todo'}
      height={400}
      width={500}
      isOpen={state.windowOpen.todo}
      onClose={() => dispatch({ windowOpen: { todo: false } })}
      provideCloseButton
    >
      <Frame
        variant="field"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          margin: 10,
        }}
      >
        <ScrollView style={{ height: 335 }}>
          <div style={{ fontWeight: 'bold' }}>todo: Think of things to do</div>
        </ScrollView>
      </Frame>
    </FlexWindowModal>
  );
};
