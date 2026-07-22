import { isNil } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { Frame } from 'react95';
import { FlexWindowModal } from '../sdk/FlexWindowModal';

export const ArtDialog = () => {
  const dispatch = useDispatch();
  return (
    <FlexWindowModal
      title={'Artwork'}
      height={390}
      width={350}
      isOpen={false}
      onClose={() => {}}
      provideCloseButton
    >
      <img style={{ margin: 10 }} src={''} />
    </FlexWindowModal>
  );
};
