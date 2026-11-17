import { useCallback, useEffect, useRef, useState } from 'react';

const easeInOut = (value: number) => value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

export function useOpeningAnimation(target: number, flowerId: string) {
  const [bloom, setBloom] = useState(0);
  const [rise, setRise] = useState(0);
  const [isOpening, setIsOpening] = useState(true);
  const frame = useRef<number | null>(null);
  const delay = useRef<number | null>(null);
  const manual = useRef(false);

  const replay = useCallback(() => {
    manual.current = false;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (delay.current !== null) window.clearTimeout(delay.current);
    setBloom(0); setRise(0); setIsOpening(true);
    delay.current = window.setTimeout(() => {
      delay.current = null;
      const started = performance.now();
      const animate = (now: number) => {
        const progress = Math.min(1, (now - started) / 2200);
        const eased = easeInOut(progress);
        setRise(eased);
        if (!manual.current) setBloom(target * eased);
        if (progress < 1 && !manual.current) frame.current = requestAnimationFrame(animate);
        else { frame.current = null; setIsOpening(false); }
      };
      frame.current = requestAnimationFrame(animate);
    }, 500);
  }, [target]);

  useEffect(() => {
    replay();
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (delay.current !== null) window.clearTimeout(delay.current);
    };
  }, [flowerId, replay]);

  const setManualBloom = useCallback((value: number) => {
    manual.current = true;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (delay.current !== null) window.clearTimeout(delay.current);
    frame.current = null; setIsOpening(false); setRise(1); setBloom(value);
  }, []);

  return { bloom, rise, isOpening, setManualBloom, replay };
}
