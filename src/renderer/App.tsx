import { createGlobalStyle, ThemeProvider } from 'styled-components';
import {
  Button,
  Separator,
  styleReset,
  TextInput,
  Toolbar,
  Window,
  WindowHeader,
} from 'react95';
import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';
import './App.css';
import MenuButtonWithDropDown from './sdk/MenuButtonWithDropDown';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isNil } from 'lodash';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { VolumeSlider } from './components/VolumeSlider';
import { ArtDialog } from './dialogs/ArtDialog';
import { LibraryTree } from './components/LibraryTree';
import { PlayerList } from './components/PlayerList';
import { AboutDialog, TodoDialog } from './dialogs/AboutDialog';
import { FlexColumn } from './sdk/FlexElements';
import { AuthDialog } from './dialogs/AuthDialog';
import { useClock } from './sdk/useClock';
import { ErrorDialog } from './dialogs/ErrorDialog';
import { NetworkGraphDialog } from './dialogs/NetworkGraphDialog';
import { FocusModeDialog } from './dialogs/FocusModeDialog';
import { HelpDialog } from './dialogs/HelpDialog';
import { ContactDialog } from './dialogs/ContactDialog';
import useGlobalState from './hooks/useGlobalState';

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif}') format('woff2');
    font-weight: 400;
    font-style: normal
  }
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif_bold}') format('woff2');
    font-weight: bold;
    font-style: normal
  }
  body {
    font-family: 'ms_sans_serif';
  }
  .window-title{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

import type { SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with { 'resolution-mode': 'import' };

export default function App() {
  const global = useGlobalState();
  const [state, dispatch] = global;
  const [tokenButtonHover, setTokenButtonHover] = useState(false);

  return (
    <ThemeProvider theme={state.config.theme}>
      <GlobalStyles />
      <Window
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SettingsDialog global={global} />

        <ArtDialog global={global} />
        <AboutDialog global={global} />
        <HelpDialog global={global} />
        {state.windowOpen.contact && <ContactDialog global={global} />}
        <TodoDialog global={global} />
        <AuthDialog global={global} />
        <NetworkGraphDialog global={global} />
        <ErrorDialog global={global} />
        <FocusModeDialog global={global} />
        <WindowHeader
          title="Subsonic95"
          className="window-title dragApplication"
        >
          <span style={{ flexGrow: 1 }}>Subsonic95</span>
          <Button
            className="clickableUnderDraggable"
            onClick={() => {
              window.electron.ipcRenderer.sendMessage('minimizeButton');
            }}
          >
            _
          </Button>
          <Button
            className="clickableUnderDraggable toolbarButton"
            onClick={() => {
              window.electron.ipcRenderer.sendMessage('quitButton');
            }}
          >
            ✕
          </Button>
        </WindowHeader>
        <Toolbar>
          <MenuButtonWithDropDown
            buttonText="File"
            menuOptions={[
              {
                text: 'Settings',
                onClick: () => dispatch({ windowOpen: { settings: true } }),
              },
            ]}
          />
          <MenuButtonWithDropDown
            buttonText="About"
            menuOptions={[
              {
                text: 'About',
                onClick: () => dispatch({ windowOpen: { about: true } }),
              },
              {
                text: 'Todo',
                onClick: () => dispatch({ windowOpen: { todo: true } }),
              },
            ]}
          />
          <Button
            variant="thin"
            onClick={() => dispatch({ windowOpen: { focus: true } })}
          >
            Focus
          </Button>
          <Button
            variant="thin"
            onClick={() => dispatch({ windowOpen: { help: true } })}
          >
            Help
          </Button>
          <Button
            variant="thin"
            onClick={() => dispatch({ windowOpen: { contact: true } })}
          >
            Contact
          </Button>
          <span style={{ flexGrow: 1 }} />

          <Button
            onClick={() => dispatch({ windowOpen: { network: true } })}
            className="toolbarButton"
          >
            <div
              style={{
                backgroundColor: undefined === 'Desync' ? 'red' : undefined,
                padding: '.2rem',
                minWidth: '5rem',
              }}
            >
              📶 {'Network'}
            </div>
          </Button>
          <Button
            onMouseOver={() => setTokenButtonHover(true)}
            onMouseLeave={() => setTokenButtonHover(false)}
            onClick={() => dispatch({ windowOpen: { auth: true } })}
            style={{ marginLeft: 4, width: 100 }}
          >
            <div>{'Auth'}</div>
          </Button>
        </Toolbar>
        <Separator />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: 1,
            marginTop: 10,
            marginLeft: 10,
            marginRight: 10,
            marginBottom: 40,
          }}
        >
          <FlexColumn
            style={{
              width: `${state.ui.leftPanelBigger ? 70 : 30}%`,
              height: '100%',
            }}
          >
            <LibraryTree global={global} />
            {state.ui.showAlbumArt && !state.ui.leftPanelBigger && (
              <Window
                title={'Artwork'}
                style={{
                  height: 410,
                  width: 375,
                }}
              >
                <WindowHeader
                  title="AlbumArt"
                  className="window-title dragApplication"
                >
                  <div
                    style={{
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {'PLACEHOLDER'}
                  </div>

                  <Button
                    className="toolbarButton clickableUnderDraggable"
                    onClick={() =>
                      dispatch({ ui: { showAlbumArt: !state.ui.showAlbumArt } })
                    }
                  >
                    ✕
                  </Button>
                </WindowHeader>
                <img style={{ height: 365, width: 365 }} />
              </Window>
            )}
            {!state.ui.showAlbumArt && !state.ui.leftPanelBigger && (
              <Button
                className="toolbarButton clickableUnderDraggable"
                onClick={() =>
                  dispatch({ ui: { showAlbumArt: !state.ui.showAlbumArt } })
                }
                style={{ width: 100, height: 30, marginTop: 5 }}
                disabled={false}
              >
                {`${state.ui.showAlbumArt ? 'hide' : 'show'} art`}
              </Button>
            )}
          </FlexColumn>
          <div
            style={{
              width: `${state.ui.leftPanelBigger ? 30 : 70}%`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Toolbar>
              <Button
                variant="thin"
                onClick={() =>
                  dispatch({
                    ui: { leftPanelBigger: !state.ui.leftPanelBigger },
                  })
                }
                style={{
                  transform: state.ui.leftPanelBigger
                    ? 'scaleX(-1)'
                    : undefined,
                }}
              >
                👉
              </Button>
              <span style={{ flexGrow: 1 }}></span>
              <Button
                style={{ marginLeft: '.5rem' }}
                onClick={() =>
                  dispatch({
                    ui: {
                      playerView:
                        state.ui.playerView === 'group'
                          ? 'individual'
                          : 'group',
                    },
                  })
                }
              >
                {state.ui.playerView === 'individual'
                  ? `Individual Tracks`
                  : `Group Tracks By Artist/Album`}
              </Button>
              <VolumeSlider />
            </Toolbar>
            <PlayerList global={global} />
          </div>
        </div>
      </Window>
    </ThemeProvider>
  );
}
