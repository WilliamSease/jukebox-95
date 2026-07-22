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
import { useDispatch, useSelector } from 'react-redux';
import {
  selectPlayerView,
  selectShowAlbumArt,
  selectTheme,
  togglePlayerView,
  toggleShowAlbumArt,
} from './state/store';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { VolumeSlider } from './components/VolumeSlider';
import { ArtDialog } from './dialogs/ArtDialog';
import { LibraryTree } from './components/LibraryTree';
import { PlayerList } from './components/PlayerList';
import { AboutDialog, TodoDialog, WhyDialog } from './dialogs/AboutDialog';
import { FlexColumn } from './sdk/FlexElements';
import { AuthDialog } from './dialogs/AuthDialog';
import { useClock } from './sdk/useClock';
import { ErrorDialog } from './dialogs/ErrorDialog';
import { NetworkGraphDialog } from './dialogs/NetworkGraphDialog';
import { FocusModeDialog } from './dialogs/FocusModeDialog';
import { HelpDialog } from './dialogs/HelpDialog';
import { ContactDialog } from './dialogs/ContactDialog';

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

export default function App() {
  const dispatch = useDispatch();

  const playerView: 'individual' | 'group' = useSelector(selectPlayerView);

  const showAlbumArt = useSelector(selectShowAlbumArt);

  const [leftPanelBigger, setLeftPanelBigger] = useState(false);

  const [tokenButtonHover, setTokenButtonHover] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiTesterOpen, setApiTesterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [debuggerIsOpen, setDebuggerIsOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [whyDialogOpen, setWhyDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [networkGraphOpen, setNetworkGraphOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);

  return (
    <ThemeProvider theme={useSelector(selectTheme)}>
      <GlobalStyles />
      <Window
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SettingsDialog
          isOpen={settingsOpen}
          closeThisWindow={() => setSettingsOpen(false)}
        />

        <ArtDialog />
        <AboutDialog
          isOpen={aboutDialogOpen}
          closeThisWindow={() => setAboutDialogOpen(false)}
        />
        <HelpDialog
          isOpen={helpDialogOpen}
          closeThisWindow={() => setHelpDialogOpen(false)}
        />
        {contactDialogOpen && (
          <ContactDialog
            isOpen={contactDialogOpen}
            closeThisWindow={() => setContactDialogOpen(false)}
          />
        )}
        <TodoDialog
          isOpen={todoDialogOpen}
          closeThisWindow={() => setTodoDialogOpen(false)}
        />
        <WhyDialog
          isOpen={whyDialogOpen}
          closeThisWindow={() => setWhyDialogOpen(false)}
        />

        <AuthDialog
          isOpen={authDialogOpen}
          closeThisWindow={() => setAuthDialogOpen(false)}
          triggerLogin={() => {}}
        />
        <NetworkGraphDialog
          isOpen={networkGraphOpen}
          closeThisWindow={() => setNetworkGraphOpen(false)}
          delays={[]}
        />
        <ErrorDialog />
        <FocusModeDialog
          isOpen={focusModeOpen}
          closeThisWindow={() => setFocusModeOpen(false)}
        />
        <WindowHeader
          title="Spotify95"
          className="window-title dragApplication"
        >
          <span style={{ flexGrow: 1 }}>Spotify95</span>
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
              { text: 'Settings', onClick: () => setSettingsOpen(true) },
              { text: 'API Tester', onClick: () => setApiTesterOpen(true) },
              { text: 'Debugger', onClick: () => setDebuggerIsOpen(true) },
            ]}
          />
          <MenuButtonWithDropDown
            buttonText="About"
            menuOptions={[
              {
                text: 'About',
                onClick: () => setAboutDialogOpen(true),
              },
              {
                text: 'Todo',
                onClick: () => setTodoDialogOpen(true),
              },
              {
                text: 'Why',
                onClick: () => setWhyDialogOpen(true),
              },
            ]}
          />
          <Button variant="thin" onClick={() => setFocusModeOpen(true)}>
            Focus
          </Button>
          <Button variant="thin" onClick={() => setHelpDialogOpen(true)}>
            Help
          </Button>
          <Button variant="thin" onClick={() => setContactDialogOpen(true)}>
            Contact
          </Button>
          <span style={{ flexGrow: 1 }} />

          <Button
            onClick={() => {
              setSearchOpen(true);
            }}
            style={{ marginLeft: 4 }}
          >
            🔎
          </Button>

          <Button
            onClick={() => setNetworkGraphOpen(true)}
            className="toolbarButton"
          >
            <div
              style={{
                backgroundColor: undefined === 'Desync' ? 'red' : undefined,
                padding: '.2rem',
                minWidth: '5rem',
              }}
            >
              📶 {'PLACEHOLDER'}
            </div>
          </Button>
          <Button
            onMouseOver={() => setTokenButtonHover(true)}
            onMouseLeave={() => setTokenButtonHover(false)}
            onClick={() => setAuthDialogOpen(true)}
            style={{ marginLeft: 4, width: 100 }}
          >
            <div>{'PLACEHOLDER'}</div>
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
            style={{ width: `${leftPanelBigger ? 70 : 30}%`, height: '100%' }}
          >
            <LibraryTree />
            {showAlbumArt && !leftPanelBigger && (
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
                    onClick={() => dispatch(toggleShowAlbumArt())}
                  >
                    ✕
                  </Button>
                </WindowHeader>
                <img style={{ height: 365, width: 365 }} />
              </Window>
            )}
            {!showAlbumArt && !leftPanelBigger && (
              <Button
                className="toolbarButton clickableUnderDraggable"
                onClick={() => dispatch(toggleShowAlbumArt())}
                style={{ width: 100, height: 30, marginTop: 5 }}
                disabled={false}
              >
                {`${showAlbumArt ? 'hide' : 'show'} art`}
              </Button>
            )}
          </FlexColumn>
          <div
            style={{
              width: `${leftPanelBigger ? 30 : 70}%`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Toolbar>
              <Button
                variant="thin"
                onClick={() => setLeftPanelBigger(!leftPanelBigger)}
                style={{
                  transform: leftPanelBigger ? 'scaleX(-1)' : undefined,
                }}
              >
                👉
              </Button>
              <span style={{ flexGrow: 1 }}></span>
              <Button
                style={{ marginLeft: '.5rem' }}
                onClick={() => dispatch(togglePlayerView())}
              >
                {playerView === 'individual'
                  ? `Individual Tracks`
                  : `Group Tracks By Artist/Album`}
              </Button>
              <VolumeSlider />
            </Toolbar>
            <PlayerList />
          </div>
        </div>
      </Window>
    </ThemeProvider>
  );
}
