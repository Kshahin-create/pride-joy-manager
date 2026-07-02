import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  suffix?: string;
}

/**
 * أنيميشن عدّاد متزايد يشتغل مرة عند تغيّر القيمة.
 */
export function CountUp({ value, duration = 900, format, className, suffix }: Props) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const text = format ? format(display) : String(Math.round(display));
  return (
    <span className={className}>
      {text}
      {suffix}
    </span>
  );
}
