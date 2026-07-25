import { useState } from 'react';
import { Button, Frame, Slider } from 'react95';
import { UsePlayerEngineResult } from '../hooks/usePlayerEngine';

export const VolumeSlider = (props: { player: UsePlayerEngineResult }) => {
  const { player } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="raised"
        onClick={() => setIsOpen(!isOpen)}
        active={isOpen}
      >
        Volume
      </Button>
      {isOpen && (
        <Frame
          variant="outside"
          style={{
            zIndex: 1,
            position: 'absolute',
            right: '0',
            bottom: '100%',
          }}
        >
          <Slider
            size="300px"
            defaultValue={player.volume * 100}
            style={{ margin: 10 }}
            orientation="vertical"
            onChangeCommitted={(value) => player.setVolume(value / 100)}
          />
        </Frame>
      )}
    </div>
  );
};
