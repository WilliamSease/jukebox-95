import { Button, Checkbox, TextInput, Toolbar } from 'react95';
import { GlobalReducer } from '../hooks/useGlobalState';
import { FlexWindowModal } from '../sdk/FlexWindowModal';

import { isEmpty, isNil } from 'lodash';
import { subsonicClient } from '../subsonic';
import { useCallback, useEffect, useState } from 'react';
import Label from '../sdk/Label';

type IProps = {
  global: GlobalReducer;
};

export const AuthDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const [remember, setRemember] = useState(false);

  // Try auto-login on mount
  useEffect(() => {
    window.settings.getRemember().then(async (remember) => {
      let useSubsonic = await window.settings.get<boolean>('useSubsonic');
      let libraryPath = await window.settings.get<string>('libraryPath');
      dispatch({ useSubsonic: useSubsonic, libraryPath: libraryPath });
      if (remember) {
        setRemember(remember);
        window.settings.loadSubsonicCreds().then((saved) => {
          if (!isNil(saved)) {
            setUrl(saved.url);
            setUser(saved.username);
            setPass(saved.password);
          }
        });
      }
    });
  }, []);

  const handleLoadLocalFolder = async () => {
    const folder = await window.localLibrary.pickFolder();
    if (!folder) return; // user cancelled the picker
    dispatch({ libraryPath: folder });
  };

  return (
    <FlexWindowModal
      title={'Auth'}
      height={500}
      width={500}
      isOpen={!state.apiReady}
      onClose={() => {}}
      bottomButtons={[
        {
          text: state.useSubsonic ? 'Login' : 'Mount',
          onPress: () => {
            window.settings.set('useSubsonic', state.useSubsonic);
            if (state.useSubsonic) {
              window.settings.set('libraryPath', state.libraryPath);
              subsonicClient
                .init(url, user, pass)
                .then(async () => {
                  if (remember) {
                    window.settings
                      .saveSubsonicCreds(url, user, pass)
                      .then(() => dispatch({ apiReady: true }))
                      .catch((err) =>
                        dispatch({
                          ui: { errorMessage: 'Login failed:' + err },
                        }),
                      );
                  } else {
                    window.settings.clearSubsonicCreds();
                    dispatch({ apiReady: true });
                  }
                })
                .catch((err) =>
                  dispatch({ ui: { errorMessage: 'Login failed:' + err } }),
                );
            } else {
              window.settings.set('libraryPath', state.libraryPath);
              if (!isEmpty(state.libraryPath))
                dispatch({
                  apiReady: true,
                });
              else
                dispatch({
                  ui: { errorMessage: 'local path cannot be empty!' },
                });
            }
          },
        },
      ]}
    >
      <div style={{ margin: '.5rem' }}>
        <div>
          {' '}
          <input
            type="radio"
            checked={state.useSubsonic}
            onChange={() => dispatch({ useSubsonic: true })}
          />
          <Label>{'Use Subsonic'}</Label>
        </div>
        <TextInput
          value={url}
          placeholder="https://yourserver.com"
          onChange={(e) => setUrl(e.target.value)}
          width={50}
          disabled={!state.useSubsonic}
        />
        <TextInput
          value={user}
          placeholder="username"
          onChange={(e) => setUser(e.target.value)}
          width={30}
          disabled={!state.useSubsonic}
        />
        <TextInput
          value={pass}
          placeholder="password"
          type="password"
          onChange={(e) => setPass(e.target.value)}
          width={30}
          disabled={!state.useSubsonic}
        />
        <Toolbar style={{ justifyContent: 'end' }}>
          <Checkbox
            className="toolbarButton"
            onClick={() => {
              setRemember(!remember);
            }}
            checked={remember}
            label={'remember...'}
            disabled={!state.useSubsonic}
          />
        </Toolbar>

        <div>
          {' '}
          <input
            type="radio"
            checked={!state.useSubsonic}
            onChange={() => dispatch({ useSubsonic: false })}
          />
          <Label>{'Use a local folder'}</Label>
        </div>
        <Toolbar
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <TextInput
            disabled={state.useSubsonic}
            value={state.libraryPath}
            onChange={(event) => dispatch({ libraryPath: event.target.value })}
            style={{ flexGrow: 1 }}
          />
          <Button className="toolbarButton" onClick={handleLoadLocalFolder}>
            Pick
          </Button>
        </Toolbar>
      </div>
    </FlexWindowModal>
  );
};
