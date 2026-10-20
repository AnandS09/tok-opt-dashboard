import { useEffect, useRef, useState } from "react";

/**
 * Returns `value`, but updates at most once every `ms` milliseconds, with a
 * trailing update so the last value always lands. Used to throttle
 * recomputation while a slider is being dragged (spec 4.1).
 */
export function useThrottledValue<T>(value: T, ms: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastRun = useRef(0);

  useEffect(() => {
    const wait = ms - (Date.now() - lastRun.current);
    if (wait <= 0) {
      lastRun.current = Date.now();
      setThrottled(value);
      return;
    }
    const timer = window.setTimeout(() => {
      lastRun.current = Date.now();
      setThrottled(value);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [value, ms]);

  return throttled;
}
