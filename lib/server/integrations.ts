import Stripe from 'stripe';
import { business, shipping } from '@/config/store';

/** Stan integracji wykrywany z konfiguracji środowiska. Sekrety nigdy nie trafiają do przeglądarki. */

export type IntegrationStatus = {
  payments: boolean;
  webhooks: boolean;
  inpostShipments: boolean;
  inpostPicker: boolean;
  email: 'resend' | 'outbox';
  missing: string[];
};

export function getIntegrationStatus(): IntegrationStatus {
  const missing: string[] = [];
  const env = process.env;

  const payments = Boolean(env.STRIPE_SECRET_KEY);
  if (!payments) missing.push('STRIPE_SECRET_KEY');

  const webhooks = payments && Boolean(env.STRIPE_WEBHOOK_SECRET);
  if (!env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');

  const inpostShipments = Boolean(env.INPOST_API_TOKEN && env.INPOST_ORGANIZATION_ID && business.sender);
  if (!env.INPOST_API_TOKEN) missing.push('INPOST_API_TOKEN');
  if (!env.INPOST_ORGANIZATION_ID) missing.push('INPOST_ORGANIZATION_ID');
  if (!business.sender) missing.push('business.sender (config/store.ts)');

  const inpostPicker = Boolean(process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN);
  if (!inpostPicker) missing.push('NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN');

  const email = env.RESEND_API_KEY && env.EMAIL_FROM ? 'resend' : 'outbox';
  if (email === 'outbox') missing.push('RESEND_API_KEY + EMAIL_FROM (e-maile zapisywane lokalnie)');

  if (shipping.paczkomat.priceGross === null) missing.push('cena dostawy paczkomat (config/store.ts)');

  return { payments, webhooks, inpostShipments, inpostPicker, email, missing };
}

let stripeClient: Stripe | null = null;

/** Klient Stripe po stronie serwera albo `null`, gdy brak klucza. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient ??= new Stripe(key);
  return stripeClient;
}
