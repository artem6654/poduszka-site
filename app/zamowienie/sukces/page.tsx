import type { Metadata } from 'next';
import Link from 'next/link';
import { product } from '@/config/store';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { formatPLN } from '@/lib/pricing';
import { findOrderBySession, type Order } from '@/lib/server/orders';

export const metadata: Metadata = {
  title: 'Dziękujemy za zamówienie',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

/**
 * Strona po powrocie ze Stripe. Nie uznaje płatności na podstawie przekierowania:
 * status pochodzi wyłącznie z zamówienia zaktualizowanego przez webhook.
 */
export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;
  const order = sessionId ? await findOrderBySession(sessionId) : null;

  return (
    <>
      <SiteHeader />
      <main className="checkout">
        <div className="wrap checkout-result">
          {!sessionId || !order ? <Unknown /> : <OrderState order={order} sessionId={sessionId} />}
          <p className="checkout-result-links">
            <Link href="/" className="link-line">
              Wróć do sklepu
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Unknown() {
  return (
    <>
      <p className="eyebrow">Zamówienie</p>
      <h1 className="h2">Nie znaleźliśmy tego zamówienia.</h1>
      <p className="body">Jeśli właśnie opłaciłeś zamówienie, potwierdzenie przyjdzie na e-mail. Adres strony mógł się zmienić.</p>
    </>
  );
}

function OrderState({ order, sessionId }: { order: Order; sessionId: string }) {
  if (order.status === 'paid') {
    const shipment = order.shipment;
    return (
      <>
        <p className="eyebrow">Zamówienie opłacone</p>
        <h1 className="h2">Dziękujemy, {order.contact.firstName}.</h1>
        <p className="body">
          Płatność za zamówienie {order.number} została potwierdzona. Potwierdzenie wysyłamy na adres {order.contact.email}.
        </p>
        <dl className="summary-lines checkout-result-summary">
          <div>
            <dt>Produkt</dt>
            <dd>
              {product.shortName}, {order.quantity} szt.
            </dd>
          </div>
          <div>
            <dt>Razem</dt>
            <dd>{formatPLN(order.totalGrosz / 100)}</dd>
          </div>
          <div>
            <dt>Dostawa</dt>
            <dd>
              {order.deliveryMethod === 'paczkomat' ? `Paczkomat ${order.paczkomatId ?? ''}` : 'Kurier InPost'}
            </dd>
          </div>
          {shipment.trackingNumber && (
            <div>
              <dt>Numer przesyłki</dt>
              <dd>{shipment.trackingNumber}</dd>
            </div>
          )}
        </dl>
        {shipment.status !== 'created' && (
          <p className="body">Przesyłkę przygotowujemy. Numer śledzenia wyślemy e-mailem po nadaniu paczki.</p>
        )}
      </>
    );
  }

  if (order.status === 'pending_payment') {
    return (
      <>
        <p className="eyebrow">Płatność w toku</p>
        <h1 className="h2">Czekamy na potwierdzenie płatności.</h1>
        <p className="body">
          Zamówienie {order.number} nie zostało jeszcze potwierdzone. Odśwież tę stronę za chwilę. Nie płać ponownie,
          jeśli transakcja jest już zrealizowana.
        </p>
        <p>
          <a href={`/zamowienie/sukces?session_id=${encodeURIComponent(sessionId)}`} className="btn btn--ghost">
            Odśwież status
          </a>
        </p>
      </>
    );
  }

  if (order.status === 'payment_mismatch') {
    return (
      <>
        <p className="eyebrow">Płatność wymaga weryfikacji</p>
        <h1 className="h2">Sprawdzamy Twoją płatność.</h1>
        <p className="body">
          Kwota płatności nie zgadza się z zamówieniem {order.number}. Nie realizujemy go automatycznie. Skontaktujemy
          się z Tobą w sprawie zwrotu lub dokończenia zamówienia.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow">Płatność nie została zrealizowana</p>
      <h1 className="h2">Zamówienie nie zostało opłacone.</h1>
      <p className="body">
        Zamówienie {order.number} nie zostało złożone, bo płatność nie została zakończona. Możesz spróbować ponownie.
      </p>
      <p>
        <Link href={`/zamowienie?pakiet=${order.packageId}`} className="btn">
          Wróć do zamówienia
        </Link>
      </p>
    </>
  );
}
