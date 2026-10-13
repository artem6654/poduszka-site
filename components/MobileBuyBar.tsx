'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePackageSelection } from '@/lib/package-context';
import { formatPLN, getQuote } from '@/lib/pricing';

/** Pasek pokazuje się po przewinięciu i znika, gdy karta zakupu albo końcowe wezwanie są na ekranie. */
const HIDE_WHILE_VISIBLE = ['wybor', 'zakup'];
const SHOW_AFTER_PX = 360;

function isInViewport(element: HTMLElement | null): boolean {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

/** Sticky pasek zakupu na telefonie: wybrany zestaw, cena i jeden przycisk. Działa poniżej 768 px (CSS). */
export function MobileBuyBar() {
  const { selected } = usePackageSelection();
  const quote = getQuote(selected);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrolledEnough = window.scrollY > SHOW_AFTER_PX;
      const blocked = HIDE_WHILE_VISIBLE.some((id) => isInViewport(document.getElementById(id)));
      setVisible(scrolledEnough && !blocked);
    };

    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, []);

  return (
    <div className="mobile-bar" data-visible={visible} aria-hidden={!visible}>
      <div className="mobile-bar-text">
        <p className="mobile-bar-title">{quote.title}</p>
        <p className="mobile-bar-price">{formatPLN(quote.total)}</p>
      </div>
      <Link href={`/zamowienie?pakiet=${selected}`} className="btn mobile-bar-cta" tabIndex={visible ? 0 : -1}>
        {quote.ctaLabel}
      </Link>
    </div>
  );
}
