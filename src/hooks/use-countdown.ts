"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Countdown in seconds, driven by a single interval + a target timestamp
 * (instead of decrementing a counter) so it stays correct even if the tab
 * is backgrounded and timers get throttled.
 */
export function useCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const targetRef = useRef<number | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const tick = () => {
      if (targetRef.current == null) return;
      const remaining = Math.ceil((targetRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };

    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [secondsLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback((seconds: number) => {
    targetRef.current = Date.now() + seconds * 1000;
    setSecondsLeft(seconds);
  }, []);

  const reset = useCallback(() => {
    targetRef.current = null;
    setSecondsLeft(0);
  }, []);

  return { secondsLeft, isRunning: secondsLeft > 0, start, reset };
}
