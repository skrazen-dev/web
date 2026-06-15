import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 → target with an ease-out curve.
 * Used for the live volume / profit counters on the command center.
 */
export function useCountUp(target: number, durationMs = 1800, startDelayMs = 0) {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    const timer = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (start === null) start = ts;
        const progress = Math.min((ts - start) / durationMs, 1);
        // easeOutExpo for a confident, decelerating settle
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(target * eased);
        if (progress < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    }, startDelayMs);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, startDelayMs]);

  return value;
}
