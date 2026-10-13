'use client';

import { packageCopy } from '@/config/store';
import { usePackageSelection } from '@/lib/package-context';
import { PACKAGE_IDS, formatPLN, getQuote } from '@/lib/pricing';

/**
 * Dwa warianty do wyboru: 1 poduszka i zestaw 2 szt. Wybór zmienia cenę, ilość i adres (?pakiet=).
 * Każda karta to etykieta radio, więc cała powierzchnia jest klikalna, a klawiatura działa natywnie.
 */
export function PackageOptions() {
  const { selected, select } = usePackageSelection();

  return (
    <fieldset className="pkg-grid">
      <legend className="sr-only">Liczba poduszek</legend>
      {PACKAGE_IDS.map((id) => {
        const quote = getQuote(id);
        const checked = selected === id;
        const isBundle = id === 'bundle';

        return (
          <label key={id} className="pkg-card" data-selected={checked}>
            <input
              type="radio"
              name="wariant"
              value={id}
              checked={checked}
              onChange={() => select(id)}
              className="pkg-input"
            />
            {isBundle && <span className="pkg-badge">{packageCopy.bundle.badge}</span>}
            <span className="pkg-title">{quote.title}</span>
            <span className="pkg-price">{formatPLN(quote.total)}</span>
            <span className="pkg-unit">
              {quote.quantity === 1 ? `Cena za sztukę: ${formatPLN(quote.unitPrice)}` : `${formatPLN(quote.unitPrice)} za sztukę`}
            </span>
            {quote.savings > 0 && <span className="pkg-saving">Oszczędzasz {formatPLN(quote.savings)}</span>}
            <span className="pkg-check" aria-hidden="true" />
          </label>
        );
      })}
    </fieldset>
  );
}
