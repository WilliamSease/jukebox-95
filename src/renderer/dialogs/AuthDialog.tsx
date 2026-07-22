import { FlexWindowModal } from '../sdk/FlexWindowModal';

type IProps = {
  isOpen: boolean;
  closeThisWindow: () => void;
  triggerLogin?: () => void;
};

export const AuthDialog = (props: IProps) => {
  const { isOpen, closeThisWindow, triggerLogin } = props;

  return (
    <FlexWindowModal
      title={'Auth'}
      height={250}
      width={500}
      isOpen={isOpen}
      onClose={closeThisWindow}
      provideCloseButton
    ></FlexWindowModal>
  );
};
