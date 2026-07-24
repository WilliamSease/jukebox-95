import { Button } from 'react95';
import { GlobalReducer } from '../hooks/useGlobalState';
import { FlexWindowModal } from '../sdk/FlexWindowModal';

import type { SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with { 'resolution-mode': 'import' };
import { isNil } from 'lodash';

type IProps = {
  global: GlobalReducer;
};

export const AuthDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  return (
    <FlexWindowModal
      title={'Auth'}
      height={250}
      width={500}
      isOpen={isNil(state.api)}
      onClose={() => {}}
    >
      <Button
        onClick={() => {
          import('subsonic-api').then(({ SubsonicAPI }) => {
            dispatch({
              api: new SubsonicAPI({
                url: 'https://demo.navidrome.org',
                auth: {
                  username: 'demo',
                  password: 'demo',
                },
              }),
            });
          });
        }}
      >
        login
      </Button>
    </FlexWindowModal>
  );
};
