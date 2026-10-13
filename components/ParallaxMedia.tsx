'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type ParallaxMediaProps = {
  children: ReactNode;
  /** Jak mocno obraz przesuwa się względem przewijania (0.05–0.12 to subtelny zakres). */
  speed?: number;
  className?: string;
};

/**
 * Subtelny parallax dla obrazów. Ustawia tylko zmienną CSS `--parallax-y` na podstawie pozycji
 * w oknie, a przesunięcie wykonuje CSS. Przy `prefers-reduced-motion` efekt jest wyłączony.
 */
export function ParallaxMedia({ children, speed = 0.08, className = '' }: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const offsetFromCentre = rect.top + rect.height / 2 - window.innerHeight / 2;
      element.style.setProperty('--parallax-y', `${(-offsetFromCentre * speed).toFixed(1)}px`);
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`parallax ${className}`.trim()}>
      <div className="parallax-inner">{children}</div>
    </div>
  );
}
