import { GlobalReducer } from '../hooks/useGlobalState';
import { FlexWindowModal } from '../sdk/FlexWindowModal';

type IProps = {
  global: GlobalReducer;
};
export const ArtDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

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
