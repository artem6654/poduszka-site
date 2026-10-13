import { shipping } from '@/config/store';
import { getQuote, isPackageId, type PackageId } from '@/lib/pricing';

/** Logika zamówienia wspólna dla serwera i interfejsu. Serwer jest źródłem prawdy dla kwot. */

export const DELIVERY_METHODS = ['paczkomat', 'kurier'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return value === 'paczkomat' || value === 'kurier';
}

/** Cena dostawy w zł brutto albo `null`, gdy metoda nie jest jeszcze skonfigurowana. */
export function deliveryPriceZl(method: DeliveryMethod): number | null {
  return shipping[method].priceGross;
}

export function isDeliveryAvailable(method: DeliveryMethod): boolean {
  return deliveryPriceZl(method) !== null;
}

export function toGrosz(amountZl: number): number {
  return Math.round(amountZl * 100);
}

export type Totals = {
  packageId: PackageId;
  quantity: number;
  /** Cena jednej sztuki w groszach (dla zestawu 17450 zamiast 174,50 zł). */
  unitGrosz: number;
  productGrosz: number;
  shippingGrosz: number;
  totalGrosz: number;
  currency: 'PLN';
};

/** Wylicza kwoty w groszach. Zwraca `null`, gdy dostawa nie jest jeszcze skonfigurowana. */
export function computeTotals(
  packageId: PackageId,
  method: DeliveryMethod,
  shippingZl: number | null = deliveryPriceZl(method),
): Totals | null {
  if (shippingZl === null) return null;

  const quote = getQuote(packageId);
  const productGrosz = toGrosz(quote.total);
  const unitGrosz = productGrosz / quote.quantity;
  if (!Number.isInteger(unitGrosz)) {
    throw new Error(`Cena jednostkowa wariantu ${packageId} nie jest pełnymi groszami.`);
  }

  const shippingGrosz = toGrosz(shippingZl);
  return {
    packageId,
    quantity: quote.quantity,
    unitGrosz,
    productGrosz,
    shippingGrosz,
    totalGrosz: productGrosz + shippingGrosz,
    currency: 'PLN',
  };
}

export type CheckoutContact = {
  firstName: string;
  lastName: string;
  email: string;
  /** Dziewięć cyfr polskiego numeru, bez prefiksu. */
  phone: string;
};

export type CheckoutAddress = {
  street: string;
  buildingNumber: string;
  apartmentNumber: string | null;
  postCode: string;
  city: string;
};

export type CheckoutInput = {
  packageId: PackageId;
  clientRequestId: string;
  contact: CheckoutContact;
  delivery:
    | { method: 'paczkomat'; paczkomatId: string }
    | { method: 'kurier'; address: CheckoutAddress };
  consent: true;
};

export type FieldErrors = Record<string, string>;

type ParseResult = { ok: true; value: CheckoutInput } | { ok: false; errors: FieldErrors };

const NAME_PATTERN = /^[\p{L}][\p{L}\s'-]{0,58}[\p{L}]$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{9}$/;
const POINT_PATTERN = /^[A-Z0-9]{4,10}$/;
const POST_CODE_PATTERN = /^\d{2}-\d{3}$/;
const BUILDING_PATTERN = /^[0-9A-Za-z/-]{1,10}$/;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,80}$/;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Normalizuje numer do dziewięciu cyfr: usuwa spacje, myślniki i prefiks +48. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[\s-]/g, '');
  if (digits.startsWith('+48')) digits = digits.slice(3);
  else if (digits.startsWith('0048')) digits = digits.slice(4);
  return digits;
}

/** Waliduje dane z formularza. Serwer uruchamia tę funkcję ponownie, niezależnie od przeglądarki. */
export function parseCheckoutInput(body: unknown): ParseResult {
  const errors: FieldErrors = {};
  const raw = (body ?? {}) as Record<string, unknown>;

  const packageId = raw.packageId;
  if (!isPackageId(packageId)) errors.packageId = 'Wybierz wariant zamówienia.';

  const clientRequestId = text(raw.clientRequestId);
  if (!REQUEST_ID_PATTERN.test(clientRequestId)) errors.clientRequestId = 'Odśwież stronę i spróbuj ponownie.';

  const contactRaw = (raw.contact ?? {}) as Record<string, unknown>;
  const firstName = text(contactRaw.firstName);
  const lastName = text(contactRaw.lastName);
  const email = text(contactRaw.email).toLowerCase();
  const phone = normalizePhone(text(contactRaw.phone));

  if (!NAME_PATTERN.test(firstName)) errors.firstName = 'Podaj imię.';
  if (!NAME_PATTERN.test(lastName)) errors.lastName = 'Podaj nazwisko.';
  if (email.length > 120 || !EMAIL_PATTERN.test(email)) errors.email = 'Podaj poprawny adres e-mail.';
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Podaj 9-cyfrowy numer telefonu.';

  const deliveryRaw = (raw.delivery ?? {}) as Record<string, unknown>;
  const method = deliveryRaw.method;
  let delivery: CheckoutInput['delivery'] | null = null;

  if (!isDeliveryMethod(method)) {
    errors.method = 'Wybierz sposób dostawy.';
  } else if (method === 'paczkomat') {
    const paczkomatId = text(deliveryRaw.paczkomatId).toUpperCase();
    if (!POINT_PATTERN.test(paczkomatId)) errors.paczkomatId = 'Wybierz paczkomat na mapie.';
    else delivery = { method: 'paczkomat', paczkomatId };
  } else {
    const addressRaw = (deliveryRaw.address ?? {}) as Record<string, unknown>;
    const street = text(addressRaw.street);
    const buildingNumber = text(addressRaw.buildingNumber);
    const apartment = text(addressRaw.apartmentNumber);
    const postCode = text(addressRaw.postCode);
    const city = text(addressRaw.city);

    if (street.length < 2 || street.length > 80) errors.street = 'Podaj ulicę.';
    if (!BUILDING_PATTERN.test(buildingNumber)) errors.buildingNumber = 'Podaj numer budynku.';
    if (apartment.length > 10) errors.apartmentNumber = 'Numer mieszkania jest za długi.';
    if (!POST_CODE_PATTERN.test(postCode)) errors.postCode = 'Podaj kod pocztowy w formacie 00-000.';
    if (city.length < 2 || city.length > 60) errors.city = 'Podaj miejscowość.';

    delivery = {
      method: 'kurier',
      address: { street, buildingNumber, apartmentNumber: apartment || null, postCode, city },
    };
  }

  if (raw.consent !== true) errors.consent = 'Zaakceptuj regulamin i politykę prywatności.';

  if (Object.keys(errors).length > 0 || !isPackageId(packageId) || !delivery) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      packageId,
      clientRequestId,
      contact: { firstName, lastName, email, phone },
      delivery,
      consent: true,
    },
  };
}
