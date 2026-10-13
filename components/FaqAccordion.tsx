'use client';

import { useId, useState } from 'react';
import { faq, product, shipping, type FaqValues } from '@/config/store';
import { formatPLN, getQuote } from '@/lib/pricing';

const { length, width, height } = product.dimensionsCm;

/** Wartości liczone z konfiguracji, żeby odpowiedzi FAQ zawsze zgadzały się z ceną na stronie. */
function faqValues(paymentsConfigured: boolean): FaqValues {
  const single = getQuote('single');
  const bundle = getQuote('bundle');
  const paczkomat = shipping.paczkomat.priceGross;

  return {
    dimensions: `${length} × ${width} × ${height} cm`,
    density: product.densityKgM3,
    singlePrice: formatPLN(single.total),
    bundlePrice: formatPLN(bundle.total),
    bundleUnitPrice: formatPLN(bundle.unitPrice),
    bundleSavings: formatPLN(bundle.savings),
    paczkomatPrice: paczkomat === null ? 'do potwierdzenia' : formatPLN(paczkomat),
    paymentsLine: paymentsConfigured
      ? `Płacisz online przez Stripe. Dostępne metody płatności zależą od konfiguracji sklepu.`
      : 'Płatności online nie są jeszcze uruchomione. Zamówienie zostanie złożone dopiero po opłaceniu.',
  };
}

/**
 * Akordeon z jedną otwartą odpowiedzią naraz. Przyciski mają `aria-expanded` i `aria-controls`.
 * Animacja wysokości działa przez `grid-template-rows`, więc nie trzeba mierzyć treści.
 */
export function FaqAccordion({ paymentsConfigured }: { paymentsConfigured: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();
  const values = faqValues(paymentsConfigured);

  return (
    <div className="faq-list">
      {faq.map((item, index) => {
        const isOpen = openIndex === index;
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.question} className="faq-item" data-open={isOpen}>
            <h3 className="faq-heading">
              <button
                type="button"
                id={triggerId}
                className="faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <span className="faq-icon" aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={triggerId} className="faq-panel">
              <div className="faq-panel-inner">
                <p>{item.answer(values)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
