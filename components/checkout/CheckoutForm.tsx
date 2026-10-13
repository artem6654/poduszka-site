'use client';

import Link from 'next/link';
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { shipping } from '@/config/store';
import { PackageOptions } from '@/components/product/PackageOptions';
import { computeTotals, isDeliveryAvailable, type DeliveryMethod } from '@/lib/checkout';
import { usePackageSelection } from '@/lib/package-context';
import { formatPLN, getQuote } from '@/lib/pricing';
import { ParcelLockerPicker, type SelectedPoint } from './ParcelLockerPicker';

type Props = {
  paymentsConfigured: boolean;
  cancelled: boolean;
};

type Contact = { firstName: string; lastName: string; email: string; phone: string };
type Address = { street: string; buildingNumber: string; apartmentNumber: string; postCode: string; city: string };

const emptyContact: Contact = { firstName: '', lastName: '', email: '', phone: '' };
const emptyAddress: Address = { street: '', buildingNumber: '', apartmentNumber: '', postCode: '', city: '' };

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Formularz zamówienia. Kwoty pokazujemy na podstawie tej samej konfiguracji co serwer,
 * ale to serwer liczy i sprawdza wszystko przy `POST /api/checkout`.
 */
export function CheckoutForm({ paymentsConfigured, cancelled }: Props) {
  const { selected } = usePackageSelection();
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [apartmentOpen, setApartmentOpen] = useState(false);
  const [point, setPoint] = useState<SelectedPoint | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const requestRef = useRef<{ key: string; id: string } | null>(null);

  const firstAvailable: DeliveryMethod | null = isDeliveryAvailable('paczkomat')
    ? 'paczkomat'
    : isDeliveryAvailable('kurier')
      ? 'kurier'
      : null;
  const [method, setMethod] = useState<DeliveryMethod | null>(firstAvailable);

  const totals = method ? computeTotals(selected, method) : null;
  const deliveryReady = method !== null && (method === 'kurier' || point !== null);
  const canSubmit = paymentsConfigured && totals !== null && deliveryReady && consent && !submitting;

  const update = (field: keyof Contact) => (event: ChangeEvent<HTMLInputElement>) =>
    setContact((current) => ({ ...current, [field]: event.target.value }));

  const updateAddress = (field: keyof Address) => (event: ChangeEvent<HTMLInputElement>) =>
    setAddress((current) => ({ ...current, [field]: event.target.value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !method) return;

    // Ten sam identyfikator dla tej samej próby: podwójne kliknięcie nie utworzy drugiego zamówienia.
    const key = JSON.stringify({ selected, method, point: point?.id ?? null, contact, address: method === 'kurier' ? address : null });
    if (requestRef.current?.key !== key) requestRef.current = { key, id: newRequestId() };

    const body = {
      packageId: selected,
      clientRequestId: requestRef.current.id,
      contact,
      delivery:
        method === 'paczkomat'
          ? { method, paczkomatId: point?.id ?? '' }
          : { method, address: { ...address, apartmentNumber: address.apartmentNumber || null } },
      consent,
    };

    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as {
        redirectUrl?: string;
        fields?: Record<string, string>;
        message?: string;
      };
      if (response.ok && typeof data.redirectUrl === 'string') {
        window.location.assign(data.redirectUrl);
        return;
      }
      setFieldErrors(data.fields ?? {});
      setMessage(data.message ?? 'Nie udało się przejść do płatności. Spróbuj ponownie.');
    } catch {
      setMessage('Brak połączenia z serwerem. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  }

  const err = (key: string) => fieldErrors[key];

  return (
    <div className="checkout-grid">
      <form className="checkout-form" onSubmit={onSubmit} noValidate>
        {cancelled && (
          <p className="notice" role="status">
            Płatność została anulowana. Zamówienie nie zostało złożone. Możesz spróbować ponownie.
          </p>
        )}
        {!paymentsConfigured && (
          <div className="notice notice--test" role="status">
            <p>
              <strong>Tryb testowy.</strong> Płatności nie są jeszcze uruchomione. Ten formularz pokazuje przebieg
              zamówienia, ale nie składa go i nie pobiera płatności.
            </p>
          </div>
        )}
        {message && (
          <p className="notice notice--error" role="alert">
            {message}
          </p>
        )}

        <fieldset className="form-section">
          <legend>Dane kontaktowe</legend>
          <div className="field-grid">
            <Field id="firstName" label="Imię" error={err('firstName')}>
              <input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={contact.firstName}
                onChange={update('firstName')}
                aria-invalid={Boolean(err('firstName'))}
                aria-describedby={err('firstName') ? 'firstName-error' : undefined}
                required
              />
            </Field>
            <Field id="lastName" label="Nazwisko" error={err('lastName')}>
              <input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                value={contact.lastName}
                onChange={update('lastName')}
                aria-invalid={Boolean(err('lastName'))}
                aria-describedby={err('lastName') ? 'lastName-error' : undefined}
                required
              />
            </Field>
            <Field id="email" label="E-mail (na niego wyślemy potwierdzenie)" error={err('email')}>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={contact.email}
                onChange={update('email')}
                aria-invalid={Boolean(err('email'))}
                aria-describedby={err('email') ? 'email-error' : undefined}
                required
              />
            </Field>
            <Field id="phone" label="Telefon (9 cyfr, InPost wysyła nim powiadomienia)" error={err('phone')}>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={contact.phone}
                onChange={update('phone')}
                aria-invalid={Boolean(err('phone'))}
                aria-describedby={err('phone') ? 'phone-error' : undefined}
                required
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Sposób dostawy</legend>
          {err('method') && <p className="field-error">{err('method')}</p>}
          <div className="delivery-options">
            {(['paczkomat', 'kurier'] as const).map((option) => {
              const available = isDeliveryAvailable(option);
              const price = shipping[option].priceGross;
              return (
                <label key={option} className="delivery-option" data-disabled={!available}>
                  <input
                    type="radio"
                    name="delivery"
                    value={option}
                    checked={method === option}
                    disabled={!available}
                    onChange={() => setMethod(option)}
                  />
                  <span className="delivery-option-title">{shipping[option].label}</span>
                  <span className="delivery-option-meta">
                    {available && price !== null ? formatPLN(price) : 'Cena do potwierdzenia'}
                  </span>
                </label>
              );
            })}
          </div>

          {method === 'paczkomat' && (
            <div className="delivery-detail">
              <ParcelLockerPicker value={point} onChange={setPoint} disabled={submitting} />
              {err('paczkomatId') && <p className="field-error">{err('paczkomatId')}</p>}
            </div>
          )}

          {method === 'kurier' && (
            <div className="delivery-detail field-grid">
              <Field id="street" label="Ulica" error={err('street')}>
                <input id="street" name="street" autoComplete="address-line1" value={address.street} onChange={updateAddress('street')} aria-invalid={Boolean(err('street'))} required />
              </Field>
              <Field id="buildingNumber" label="Numer budynku" error={err('buildingNumber')}>
                <input id="buildingNumber" name="buildingNumber" value={address.buildingNumber} onChange={updateAddress('buildingNumber')} aria-invalid={Boolean(err('buildingNumber'))} required />
              </Field>
              {apartmentOpen ? (
                <Field id="apartmentNumber" label="Numer mieszkania" error={err('apartmentNumber')}>
                  <input id="apartmentNumber" name="apartmentNumber" value={address.apartmentNumber} onChange={updateAddress('apartmentNumber')} />
                </Field>
              ) : (
                <button type="button" className="link-button" onClick={() => setApartmentOpen(true)}>
                  Dodaj numer mieszkania
                </button>
              )}
              <Field id="postCode" label="Kod pocztowy" error={err('postCode')}>
                <input id="postCode" name="postCode" inputMode="numeric" autoComplete="postal-code" placeholder="00-000" value={address.postCode} onChange={updateAddress('postCode')} aria-invalid={Boolean(err('postCode'))} required />
              </Field>
              <Field id="city" label="Miejscowość" error={err('city')}>
                <input id="city" name="city" autoComplete="address-level2" value={address.city} onChange={updateAddress('city')} aria-invalid={Boolean(err('city'))} required />
              </Field>
            </div>
          )}
        </fieldset>

        <div className="consent">
          <label>
            <input type="checkbox" name="consent" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>
              Akceptuję <Link href="/informacje/regulamin">regulamin</Link> i{' '}
              <Link href="/informacje/prywatnosc">politykę prywatności</Link>.
            </span>
          </label>
          {err('consent') && <p className="field-error">{err('consent')}</p>}
        </div>

        <button type="submit" className="btn btn--buy" disabled={!canSubmit}>
          {submitting
            ? 'Przechodzę do płatności…'
            : totals
              ? `Przejdź do płatności, ${formatPLN(totals.totalGrosz / 100)}`
              : 'Przejdź do płatności'}
        </button>
        <p className="checkout-fineprint">
          Zamówienie zostanie złożone dopiero po potwierdzeniu płatności. Kwoty ostatecznie sprawdza serwer.
        </p>
      </form>

      <aside className="checkout-summary" aria-labelledby="summary-title">
        <h2 id="summary-title" className="buy-title">
          Twoje zamówienie
        </h2>
        <PackageOptions />
        <dl className="summary-lines">
          <div>
            <dt>Produkty</dt>
            <dd>{formatPLN(getQuote(selected).total)}</dd>
          </div>
          <div>
            <dt>Dostawa</dt>
            <dd>{totals ? formatPLN(totals.shippingGrosz / 100) : '—'}</dd>
          </div>
          <div className="summary-lines-total">
            <dt>Razem</dt>
            <dd>{totals ? formatPLN(totals.totalGrosz / 100) : '—'}</dd>
          </div>
        </dl>
        <p className="summary-note">Płatność obsługuje Stripe. Dostępne metody zależą od konfiguracji sklepu.</p>
      </aside>
    </div>
  );
}
