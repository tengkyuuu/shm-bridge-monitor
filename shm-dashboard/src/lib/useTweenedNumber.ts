import { useEffect, useRef, useState } from 'react';

// Smoothly animates a number from its previous value to a new target over
// `durationMs` using an ease-out cubic curve. If `target` changes mid-tween,
// the animation reroutes from the current displayed value to the new target —
// no snap-back to the previous starting point.
export function useTweenedNumber(target: number, durationMs = 800): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  valueRef.current = value;

  const lastTargetRef = useRef(target);

  useEffect(() => {
    if (target === lastTargetRef.current) return;
    lastTargetRef.current = target;

    const from = valueRef.current;
    const delta = target - from;
    if (delta === 0) return;

    let rafId: number;
    let startTs: number | null = null;

    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const t = Math.min(1, (ts - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(from + delta * eased);
      if (t < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return value;
}
