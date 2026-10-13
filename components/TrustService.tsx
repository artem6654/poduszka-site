import { returnsPolicy, shipping } from '@/config/store';
import { formatPLN } from '@/lib/pricing';
import { Reveal } from './Reveal';

type Props = {
  paymentsConfigured: boolean;
};

/** Dostawa i zwroty. Pokazujemy tylko to, co zostało potwierdzone; reszta jest oznaczona jako do potwierdzenia. */
export function TrustService({ paymentsConfigured }: Props) {
  const paczkomat = shipping.paczkomat.priceGross;
  const courier = shipping.kurier.priceGross;

  const items = [
    {
      id: 'dostawa',
      title: 'Dostawa InPost',
      lines: [
        paczkomat === null
          ? `${shipping.paczkomat.label}: koszt do potwierdzenia.`
          : `${shipping.paczkomat.label}: ${formatPLN(paczkomat)}.`,
        courier === null
          ? `${shipping.kurier.label}: koszt do potwierdzenia.`
          : `${shipping.kurier.label}: ${formatPLN(courier)}.`,
        'Numer przesyłki wysyłamy e-mailem po nadaniu paczki.',
      ],
    },
    {
      id: 'zwroty',
      title: 'Zwroty',
      lines: [returnsPolicy.summary ?? returnsPolicy.pending],
    },
    {
      id: 'platnosci',
      title: 'Płatności',
      lines: paymentsConfigured
        ? ['Płatność online przez Stripe. Zamówienie jest składane po potwierdzeniu płatności.']
        : ['Płatności online nie są jeszcze uruchomione. Zamówienie nie zostanie złożone bez płatności.'],
    },
    {
      id: 'obsluga',
      title: 'Obsługa klienta',
      lines: ['Dane kontaktowe znajdziesz w stopce strony.'],
    },
  ];

  return (
    <section className="section trust" aria-labelledby="trust-title">
      <div className="wrap">
        <Reveal className="section-head">
          <p className="eyebrow">Dostawa i zwroty</p>
          <h2 id="trust-title" className="h2">
            Jasne zasady zakupu.
          </h2>
          <p className="lead">Te same zasady dostawy i zwrotów obowiązują w każdym wariancie.</p>
        </Reveal>

        <div className="trust-grid">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 80} className="trust-item">
              <h3 className="h3">{item.title}</h3>
              {item.lines.map((line) => (
                <p key={line} className="body" data-pending={line.includes('do potwierdzenia') || line.includes('opublikujemy')}>
                  {line}
                </p>
              ))}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
