import { brand, product } from '@/config/store';
import { formatPLN } from '@/lib/pricing';
import type { Order } from '@/lib/server/orders';
import type { OutgoingMail } from '@/lib/server/email';

const money = (grosz: number) => formatPLN(grosz / 100);

function deliveryLine(order: Order): string {
  if (order.deliveryMethod === 'paczkomat') return `Paczkomat InPost ${order.paczkomatId ?? ''}`.trim();
  const address = order.address;
  if (!address) return 'Kurier InPost';
  const apartment = address.apartmentNumber ? `/${address.apartmentNumber}` : '';
  return `Kurier InPost: ${address.street} ${address.buildingNumber}${apartment}, ${address.postCode} ${address.city}`;
}

/** Potwierdzenie wysyłane po opłaceniu zamówienia. */
export function confirmationMail(order: Order): OutgoingMail {
  const greeting = `Dzień dobry ${order.contact.firstName},`;
  const text = [
    greeting,
    '',
    `dziękujemy za zamówienie ${order.number}. Płatność została potwierdzona.`,
    '',
    `Produkt: ${product.shortName}, ${order.quantity} szt.`,
    `Razem: ${money(order.totalGrosz)} (w tym dostawa ${money(order.shippingGrosz)})`,
    `Dostawa: ${deliveryLine(order)}`,
    '',
    'Numer przesyłki wyślemy w osobnej wiadomości, gdy paczka zostanie nadana.',
    '',
    brand.name,
  ].join('\n');

  return {
    to: order.contact.email,
    subject: `Potwierdzenie zamówienia ${order.number}`,
    text,
  };
}

/** Wiadomość z numerem śledzenia InPost. */
export function trackingMail(order: Order, trackingNumber: string): OutgoingMail {
  const url = `https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(trackingNumber)}`;
  const text = [
    `Dzień dobry ${order.contact.firstName},`,
    '',
    `Twoja przesyłka do zamówienia ${order.number} została nadana.`,
    `Numer przesyłki: ${trackingNumber}`,
    `Śledzenie: ${url}`,
    '',
    brand.name,
  ].join('\n');

  return {
    to: order.contact.email,
    subject: `Przesyłka do zamówienia ${order.number} jest w drodze`,
    text,
  };
}
