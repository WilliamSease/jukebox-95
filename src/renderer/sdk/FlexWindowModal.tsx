import { Button, Toolbar, Window, WindowHeader } from 'react95';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../sdk/Modal';
import Label from '../sdk/Label';
import { isNil } from 'lodash';

export type BottomButton = {
  text: string;
  onPress: () => void;
  closesWindow?: boolean;
  disabled?: boolean;
};

type IProps = {
  title: string;
  height: number | string;
  width: number | string;
  isOpen: boolean;
  onClose: () => void;
  provideCloseButton?: boolean;
  onBack?: () => void;
  children?: ReactNode;
  endLabel?: string;
  bottomButtons?: BottomButton[];
  screenSaverBackground?: boolean;
};

export const FlexWindowModal = (props: IProps) => {
  const {
    title,
    isOpen,
    height,
    width,
    onClose,
    onBack,
    provideCloseButton,
    children,
    endLabel,
    bottomButtons,
    screenSaverBackground,
  } = props;

  // Offset from the flexbox-centered position, applied via transform so
  // Modal's own centering logic never needs to know dragging exists.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  // Reset position whenever the window closes, so it reopens centered
  // rather than wherever it was last dragged to.
  useEffect(() => {
    if (!isOpen) setOffset({ x: 0, y: 0 });
  }, [isOpen]);

  // Escape hatch: dragging can push the window past the app's own bounds
  // (nothing currently clamps the offset), so Escape always gets you back
  // to a closed, known-good state regardless of where the window ended up.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Let header buttons (back/close) work normally instead of starting a drag —
      // same intent your "clickableUnderDraggable" className was already reaching for.
      if ((e.target as HTMLElement).closest('button')) return;

      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const drag = dragStateRef.current;
        if (!drag) return;
        setOffset({
          x: drag.startOffsetX + (moveEvent.clientX - drag.startX),
          y: drag.startOffsetY + (moveEvent.clientY - drag.startY),
        });
      };

      const handleMouseUp = () => {
        dragStateRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [offset],
  );

  return (
    <Modal isOpen={isOpen} screenSaverBackground={screenSaverBackground}>
      {isOpen && (
        <Window
          style={{
            width: width,
            height: height,
            display: 'flex',
            flexDirection: 'column',
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
          shadow
        >
          <WindowHeader
            title={title}
            className="window-title"
            onMouseDown={handleHeaderMouseDown}
            style={{ cursor: 'move' }}
          >
            <span style={{ flexGrow: 1 }}>{title}</span>
            {!isNil(onBack) && (
              <Button
                className="toolbarButton clickableUnderDraggable"
                onClick={onBack}
              >
                {`<-`}
              </Button>
            )}
            {provideCloseButton && (
              <Button
                className="toolbarButton clickableUnderDraggable"
                onClick={onClose}
              >
                ✕
              </Button>
            )}
          </WindowHeader>
          {children}
          {(endLabel || bottomButtons) && (
            <Toolbar
              style={{
                flexGrow: 1,
                alignItems: 'end',
                justifyContent: 'end',
              }}
            >
              {endLabel && <Label>{endLabel}</Label>}
              {bottomButtons?.map((bb, i) => {
                return (
                  <Button
                    key={i}
                    style={{ marginLeft: '.25rem' }}
                    onClick={() => {
                      bb.onPress();
                      if (bb.closesWindow) {
                        onClose();
                      }
                    }}
                    disabled={bb.disabled}
                  >
                    {bb.text}
                  </Button>
                );
              })}
            </Toolbar>
          )}
        </Window>
      )}
    </Modal>
  );
};
