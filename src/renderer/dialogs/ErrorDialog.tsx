import { isNil } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { error } from '../images';
import { FlexColumn, FlexRow } from '../sdk/FlexElements';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import { selectErrorMessage, setErrorMessage } from '../state/store';

export const ErrorDialog = () => {
  const dispatch = useDispatch();
  const errorMessage = useSelector(selectErrorMessage);
  return (
    <FlexWindowModal
      title={'Error'}
      height={200}
      width={600}
      isOpen={!isNil(errorMessage)}
      onClose={() => {
        dispatch(setErrorMessage(null));
      }}
      provideCloseButton
    >
      <FlexRow>
        <div style={{ width: '20%' }}>
          <img src={error} style={{ width: '100%' }} />
        </div>
        <div style={{ marginTop: '1rem' }}>{errorMessage}</div>
      </FlexRow>
    </FlexWindowModal>
  );
};
