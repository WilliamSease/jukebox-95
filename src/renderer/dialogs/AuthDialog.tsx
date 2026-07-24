import { GlobalReducer } from '../hooks/useGlobalState';
import { FlexWindowModal } from '../sdk/FlexWindowModal';

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
      isOpen={state.windowOpen.auth}
      onClose={() => dispatch({ windowOpen: { auth: false } })}
      provideCloseButton
    ></FlexWindowModal>
  );
};
