import { ValidationError, useForm } from '@formspree/react';
import { Button, TextInput } from 'react95';
import { FlexRow } from '../sdk/FlexElements';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import Label from '../sdk/Label';
import { GlobalReducer } from '../hooks/useGlobalState';

type IProps = {
  global: GlobalReducer;
};

export const ContactDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const [formState, handleSubmit] = useForm('xkndnwwp');

  return (
    <FlexWindowModal
      title={'Contact'}
      height={450}
      width={500}
      isOpen={state.windowOpen.contact}
      onClose={() => dispatch({ windowOpen: { contact: false } })}
      provideCloseButton
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            height: 'unset',
            width: 'unset',
            display: 'flex',
            flexDirection: 'column',
            margin: 25,
          }}
        >
          <Label htmlFor="email">Email</Label>
          <TextInput
            placeholder="something@somewhere.[com|etc]"
            id="email"
            type="email"
            name="email"
            required
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={formState.errors}
          />
          <div>
            <Label htmlFor="message">Message</Label>
            <TextInput
              multiline
              placeholder="Anything you type in this box I will read"
              id="message"
              name="message"
              style={{ width: '100%', height: '13rem' }}
              required
            />
          </div>
          <ValidationError
            prefix="Message"
            field="message"
            errors={formState.errors}
          />
          <FlexRow style={{ marginTop: 10 }}>
            {formState.succeeded && 'Receieved ✔️'}
            {formState.submitting && 'Submitting... ⌛'}
            {!formState.succeeded && !formState.submitting && (
              <Button type="submit" disabled={formState.submitting}>
                Send
              </Button>
            )}
          </FlexRow>
        </form>
      </div>
    </FlexWindowModal>
  );
};
