import { useEffect, useState } from "react";

/**
 * Returns true once there has been no user input (mouse, keyboard, touch, wheel)
 * for `timeout` ms — used to drop into the ambient "screensaver" mode. Any input
 * resets it to false immediately. Pass `enabled=false` to suspend detection.
 */
export function useIdle(timeout: number, enabled = true): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIdle(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), timeout);
    };
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "wheel",
      "touchstart",
      "pointerdown",
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [timeout, enabled]);

  return idle;
}
