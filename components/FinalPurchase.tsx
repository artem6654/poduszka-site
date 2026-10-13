'use client';

import Link from 'next/link';
import { product } from '@/config/store';
import { Crescent, Sparkles } from './background/Crescent';
import { WaveEdge } from './background/WaveEdge';
import { Reveal } from './Reveal';
import { usePackageSelection } from '@/lib/package-context';
import { formatPLN, getQuote } from '@/lib/pricing';

/** Końcowe wezwanie do zakupu. Powtarza wybrany wariant i cenę, bez drugiego wyboru. */
export function FinalPurchase() {
  const { selected } = usePackageSelection();
  const quote = getQuote(selected);

  return (
    <section id="zakup" className="final has-deco" aria-labelledby="final-title">
      <div className="final-media">
        <img
          src="/images/bundle-two-pillows.webp"
          width={1024}
          height={1024}
          loading="lazy"
          alt="Dwie identyczne poduszki JUSKYS XL na jasnej lnianej pościeli. Grafika poglądowa."
        />
      </div>

      <div className="wrap final-inner">
        <Crescent id="final-moon" className="final-moon" />
        <Sparkles
          className="final-spark"
          items={[
            { x: 6, y: 4, size: 8 },
            { x: 92, y: 30, size: 6 },
          ]}
        />
        <Reveal className="final-copy">
          <p className="eyebrow">Gotowy na zmianę?</p>
          <h2 id="final-title" className="h2">
            Zacznij wieczory od lepszego podparcia.
          </h2>
          <p className="final-product">{product.shortName}</p>

          <div className="final-summary">
            <div>
              <p className="final-option-title">{quote.title}</p>
              <p className="final-option-price">{formatPLN(quote.total)}</p>
              {quote.savings > 0 && (
                <p className="final-option-note">
                  {formatPLN(quote.unitPrice)} za sztukę, oszczędzasz {formatPLN(quote.savings)}
                </p>
              )}
            </div>
            <Link href={`/zamowienie?pakiet=${selected}`} className="btn">
              {quote.ctaLabel}, {formatPLN(quote.total)}
            </Link>
          </div>
        </Reveal>
      </div>
      <WaveEdge fill="#F5F0E7" />
    </section>
  );
}
