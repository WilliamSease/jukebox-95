import { Button, Checkbox, TextInput, Toolbar } from 'react95';
import { GlobalReducer } from '../hooks/useGlobalState';
import { FlexWindowModal } from '../sdk/FlexWindowModal';

import { isNil } from 'lodash';
import { subsonicClient } from '../subsonic';
import { useEffect, useState } from 'react';

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
    window.settings.loadSubsonicCreds().then((saved) => {
      if (!isNil(saved)) {
        setUrl(saved.url);
        setUser(saved.username);
        setPass(saved.password);
        setRemember(true);
      }
    });
  }, []);

  return (
    <FlexWindowModal
      title={'Auth'}
      height={250}
      width={500}
      isOpen={!state.apiReady}
      onClose={() => {}}
    >
      <TextInput
        value={url}
        placeholder="https://yourserver.com"
        onChange={(e) => setUrl(e.target.value)}
        width={50}
      />
      <TextInput
        value={user}
        placeholder="username"
        onChange={(e) => setUser(e.target.value)}
        width={30}
      />
      <TextInput
        value={pass}
        placeholder="password"
        type="password"
        onChange={(e) => setPass(e.target.value)}
        width={30}
      />
      <Toolbar style={{ justifyContent: 'end' }}>
        <Checkbox
          className="toolbarButton"
          onClick={() => {
            setRemember(!remember);
          }}
          label={'remember...'}
        />
        <Button
          className="toolbarButton"
          onClick={() => {
            subsonicClient
              .init(url, user, pass)
              .then(() => {
                if (remember)
                  window.settings
                    .saveSubsonicCreds(url, user, pass)
                    .then(() => dispatch({ apiReady: true }))
                    .catch((err) =>
                      dispatch({ ui: { errorMessage: 'Login failed:' + err } }),
                    );
                else dispatch({ apiReady: true });
              })
              .catch((err) =>
                dispatch({ ui: { errorMessage: 'Login failed:' + err } }),
              );
          }}
        >
          login
        </Button>
      </Toolbar>
    </FlexWindowModal>
  );
};
