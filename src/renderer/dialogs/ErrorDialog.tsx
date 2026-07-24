import { isNil } from 'lodash';
import { error } from '../images';
import { FlexColumn, FlexRow } from '../sdk/FlexElements';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import { GlobalReducer } from '../hooks/useGlobalState';

export const ErrorDialog = (props: { global: GlobalReducer }) => {
  const [state, dispatch] = props.global;
  return (
    <FlexWindowModal
      title={'Error'}
      height={200}
      width={600}
      isOpen={!isNil(state.ui.errorMessage)}
      onClose={() => {
        dispatch({ ui: { errorMessage: undefined } });
      }}
      provideCloseButton
    >
      <FlexRow>
        <div style={{ width: '20%' }}>
          <img src={error} style={{ width: '100%' }} />
        </div>
        <div style={{ marginTop: '1rem' }}>{state.ui.errorMessage}</div>
      </FlexRow>
    </FlexWindowModal>
  );
};
