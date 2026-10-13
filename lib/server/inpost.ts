import { business, shipping } from '@/config/store';
import type { Order } from '@/lib/server/orders';

/**
 * Tworzenie przesyłek w InPost ShipX (REST).
 *
 * Zweryfikowane w dokumentacji InPost: endpoint `/v1/organizations/{id}/shipments`,
 * `custom_attributes.target_point` i `sending_method: dispatch_order` dla usług paczkomatowych.
 * Do potwierdzenia w środowisku sandbox przed produkcją: format adresu odbiorcy kurierem (`flat_number`),
 * format nadawcy oraz szablon paczki (`template: large`) dla Państwa umowy.
 */

export class ShipmentNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShipmentNotConfiguredError';
  }
}

type ShipXSettings = { base: string; token: string; organizationId: string };

export function inpostSettings(): ShipXSettings | null {
  const token = process.env.INPOST_API_TOKEN;
  const organizationId = process.env.INPOST_ORGANIZATION_ID;
  if (!token || !organizationId) return null;
  const base = process.env.INPOST_API_BASE ?? 'https://api-shipx-pl.easypack24.net';
  return { base, token, organizationId };
}

/** Sprawdza komplet danych potrzebnych do utworzenia przesyłki. */
export function inpostReadiness(): { ready: true } | { ready: false; reason: string } {
  if (!inpostSettings()) return { ready: false, reason: 'Brak INPOST_API_TOKEN lub INPOST_ORGANIZATION_ID.' };
  if (!business.sender) return { ready: false, reason: 'Brak danych nadawcy w config/store.ts (business.sender).' };
  if (shipping.parcel.weightKg === null) {
    return { ready: false, reason: 'Brak potwierdzonego ciężaru paczki (shipping.parcel.weightKg).' };
  }
  return { ready: true };
}

export type ShipmentResult = { inpostShipmentId: string; trackingNumber: string | null };

function receiverPayload(order: Order): Record<string, unknown> {
  const base = {
    first_name: order.contact.firstName,
    last_name: order.contact.lastName,
    email: order.contact.email,
    phone: order.contact.phone,
  };

  if (order.deliveryMethod === 'paczkomat') return base;

  const address = order.address;
  if (!address) throw new Error('Zamówienie kurierskie bez adresu.');
  return {
    ...base,
    address: {
      street: address.street,
      building_number: address.buildingNumber,
      flat_number: address.apartmentNumber ?? undefined,
      city: address.city,
      post_code: address.postCode,
      country_code: 'PL',
    },
  };
}

function senderPayload(): Record<string, unknown> {
  const sender = business.sender;
  if (!sender) throw new ShipmentNotConfiguredError('Brak danych nadawcy.');
  return {
    name: sender.name,
    email: sender.email,
    phone: sender.phone,
    address: {
      street: sender.street,
      building_number: sender.buildingNumber,
      city: sender.city,
      post_code: sender.postCode,
      country_code: 'PL',
    },
  };
}

export function buildShipmentPayload(order: Order): Record<string, unknown> {
  const method = order.deliveryMethod;
  const service = shipping[method].service;
  const customAttributes: Record<string, string> =
    method === 'paczkomat'
      ? { target_point: order.paczkomatId ?? '', sending_method: 'dispatch_order' }
      : { sending_method: 'dispatch_order' };

  if (method === 'paczkomat' && !order.paczkomatId) {
    throw new Error('Zamówienie paczkomatowe bez identyfikatora punktu.');
  }

  const weightKg = shipping.parcel.weightKg;
  const parcel = {
    template: shipping.parcel.template,
    ...(weightKg !== null ? { weight: { amount: weightKg, unit: 'kg' } } : {}),
  };

  return {
    service,
    reference: order.number,
    receiver: receiverPayload(order),
    sender: senderPayload(),
    parcels: [parcel],
    custom_attributes: customAttributes,
  };
}

/** Tworzy przesyłkę w ShipX. Wywoływane wyłącznie po potwierdzonej płatności. */
export async function createInpostShipment(order: Order): Promise<ShipmentResult> {
  const readiness = inpostReadiness();
  if (!readiness.ready) throw new ShipmentNotConfiguredError(readiness.reason);
  const settings = inpostSettings();
  if (!settings) throw new ShipmentNotConfiguredError('Brak ustawień InPost.');

  const response = await fetch(`${settings.base}/v1/organizations/${settings.organizationId}/shipments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildShipmentPayload(order)),
  });

  const body = (await response.json().catch(() => null)) as { id?: number | string; tracking_number?: string | null; message?: string } | null;
  if (!response.ok || !body || body.id === undefined) {
    throw new Error(`InPost ShipX zwrócił ${response.status}: ${body?.message ?? 'brak treści odpowiedzi'}`);
  }

  return {
    inpostShipmentId: String(body.id),
    trackingNumber: body.tracking_number ?? null,
  };
}
