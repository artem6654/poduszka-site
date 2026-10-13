import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { business } from '../config/store';
import type { Order } from '../lib/server/orders';

// Dane nadawcy są potrzebne do zbudowania przesyłki. W teście ustawiamy je tymczasowo.
(business as { sender: unknown }).sender = {
  name: 'Sklep testowy',
  street: 'Testowa',
  buildingNumber: '1',
  city: 'Warszawa',
  postCode: '00-001',
  email: 'sklep@example.pl',
  phone: '500000000',
};

let buildShipmentPayload: typeof import('../lib/server/inpost').buildShipmentPayload;

before(async () => {
  buildShipmentPayload = (await import('../lib/server/inpost')).buildShipmentPayload;
});

const base: Order = {
  id: '00000000-0000-4000-8000-000000000001',
  number: 'JX-00000000',
  clientRequestId: 'req-inpost-0001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  packageId: 'bundle',
  quantity: 2,
  currency: 'PLN',
  unitGrosz: 17450,
  productGrosz: 34900,
  shippingGrosz: 1500,
  totalGrosz: 36400,
  deliveryMethod: 'paczkomat',
  paczkomatId: 'KRA010',
  address: null,
  contact: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.pl', phone: '512345678' },
  status: 'paid',
  stripeSessionId: null,
  redirectUrl: null,
  stripePaymentIntentId: null,
  paidAt: null,
  emails: { confirmationSentAt: null, trackingSentAt: null },
  shipment: { status: 'not_created', inpostShipmentId: null, trackingNumber: null, error: null, startedAt: null },
};

test('paczkomat: usługa paczkomatowa i punkt docelowy w custom_attributes', () => {
  const payload = buildShipmentPayload(base) as Record<string, unknown>;
  assert.equal(payload.service, 'inpost_locker_standard');
  assert.equal(payload.reference, 'JX-00000000');
  assert.deepEqual(payload.custom_attributes, { target_point: 'KRA010', sending_method: 'dispatch_order' });
  assert.equal((payload.receiver as Record<string, unknown>).email, 'anna@example.pl');
});

test('kurier: usługa kurierska z adresem odbiorcy i bez punktu docelowego', () => {
  const payload = buildShipmentPayload({
    ...base,
    deliveryMethod: 'kurier',
    paczkomatId: null,
    address: { street: 'Długa', buildingNumber: '5', apartmentNumber: '7', postCode: '00-001', city: 'Warszawa' },
  }) as Record<string, unknown>;
  assert.equal(payload.service, 'inpost_courier_standard');
  assert.deepEqual(payload.custom_attributes, { sending_method: 'dispatch_order' });
  const receiver = payload.receiver as { address: Record<string, unknown> };
  assert.equal(receiver.address.post_code, '00-001');
  assert.equal(receiver.address.country_code, 'PL');
});

test('paczkomat bez identyfikatora punktu nie tworzy przesyłki', () => {
  assert.throws(() => buildShipmentPayload({ ...base, paczkomatId: null }));
});
