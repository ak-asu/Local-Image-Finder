
import { useState, useRef, useCallback } from 'react';

interface LongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // Time in ms
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500
}: LongPressOptions) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const target = useRef<EventTarget>();

  const start = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.persist();
    const clonedEvent = { ...event };
    target.current = event.target;
    timeout.current = setTimeout(() => {
      onLongPress();
      setLongPressTriggered(true);
    }, threshold);
  }, [onLongPress, threshold]);

  const clear = useCallback((event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
    timeout.current && clearTimeout(timeout.current);
    if (shouldTriggerClick && !longPressTriggered && onClick) {
      onClick();
    }
    setLongPressTriggered(false);
  }, [onClick, longPressTriggered]);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    longPressTriggered
  };
}

export default useLongPress;
