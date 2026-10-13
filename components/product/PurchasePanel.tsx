'use client';

import Link from 'next/link';
import { returnsPolicy, shipping } from '@/config/store';
import { usePackageSelection } from '@/lib/package-context';
import { formatPLN, getQuote } from '@/lib/pricing';
import { PackageOptions } from './PackageOptions';

type Props = {
  /** Czy płatności online są skonfigurowane po stronie serwera. Bez tego nie pokazujemy obietnicy płatności. */
  paymentsConfigured: boolean;
};

/** Karta zakupu: wybór wariantu, cena, jeden główny przycisk i krótki wiersz informacji. */
export function PurchasePanel({ paymentsConfigured }: Props) {
  const { selected } = usePackageSelection();
  const quote = getQuote(selected);

  const paczkomatPrice = shipping.paczkomat.priceGross;
  const courierPrice = shipping.kurier.priceGross;
  const paczkomatText = paczkomatPrice === null ? 'koszt do potwierdzenia' : formatPLN(paczkomatPrice);
  const courierText = courierPrice === null ? null : `kurier ${formatPLN(courierPrice)}`;

  return (
    <section id="wybor" className="buy" aria-labelledby="buy-title">
      <h2 id="buy-title" className="buy-title">
        Wybierz zestaw
      </h2>

      <PackageOptions />

      <div className="buy-total" aria-live="polite">
        <div>
          <p className="buy-total-label">Razem</p>
          <p key={selected} className="buy-total-amount">
            {formatPLN(quote.total)}
          </p>
        </div>
        <p className="buy-total-meta">
          {quote.quantity} szt.
          {quote.savings > 0 && <> · oszczędzasz {formatPLN(quote.savings)}</>}
        </p>
      </div>

      <Link href={`/zamowienie?pakiet=${selected}`} className="btn btn--buy">
        {quote.ctaLabel}, {formatPLN(quote.total)}
      </Link>

      <ul className="buy-info">
        {paymentsConfigured && <li>Bezpieczna płatność online</li>}
        <li>
          Dostawa InPost: paczkomat, {paczkomatText}
          {courierText && <>, {courierText}</>}
        </li>
        <li>Zwroty: {returnsPolicy.summary ?? 'zasady do potwierdzenia'}</li>
      </ul>
    </section>
  );
}
