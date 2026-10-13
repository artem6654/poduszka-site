import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Stripe from 'stripe';

// Środowisko testowe: bez prawdziwych kluczy i bez wysyłki poza katalog tymczasowy.
const tmp = mkdtempSync(path.join(os.tmpdir(), 'poduszka-webhook-'));
process.chdir(tmp);
process.env.ORDER_STORE_PATH = path.join(tmp, 'orders.json');
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_for_tests';
delete process.env.RESEND_API_KEY;
delete process.env.EMAIL_FROM;
delete process.env.INPOST_API_TOKEN;
delete process.env.INPOST_ORGANIZATION_ID;

let POST: (request: Request) => Promise<Response>;
let orders: typeof import('../lib/server/orders');

before(async () => {
  POST = (await import('../app/api/stripe/webhook/route')).POST;
  orders = await import('../lib/server/orders');
});
const stripe = new Stripe('sk_test_dummy_for_tests');
const secret = 'whsec_test_dummy_for_tests';

async function outboxCount(): Promise<number> {
  try {
    return (await readdir(path.join(tmp, '.data', 'outbox'))).length;
  } catch {
    return 0;
  }
}

async function newOrder(clientRequestId: string, sessionId: string) {
  const { order } = await orders.createOrder({
    clientRequestId,
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
  });
  await orders.updateOrder(order.id, (o) => {
    o.stripeSessionId = sessionId;
  });
  return order;
}

function sessionObject(orderId: string, sessionId: string, amount: number, paymentStatus = 'paid') {
  return {
    id: sessionId,
    object: 'checkout.session',
    payment_status: paymentStatus,
    amount_total: amount,
    currency: 'pln',
    metadata: { orderId },
    client_reference_id: orderId,
    payment_intent: 'pi_test_1',
  };
}

function signedRequest(eventId: string, type: string, object: unknown, signWith = secret): Request {
  const payload = JSON.stringify({
    id: eventId,
    object: 'event',
    type,
    api_version: '2025-01-27.acacia',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    data: { object },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: signWith });
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': header, 'content-type': 'application/json' },
    body: payload,
  });
}

test('zły podpis jest odrzucany przed jakimkolwiek działaniem', async () => {
  const order = await newOrder('req-sig-0001', 'cs_test_sig_1');
  const response = await POST(
    signedRequest('evt_bad_sig', 'checkout.session.completed', sessionObject(order.id, 'cs_test_sig_1', 36400), 'whsec_inny'),
  );
  assert.equal(response.status, 400);
  const stored = await orders.getOrder(order.id);
  assert.equal(stored?.status, 'pending_payment');
});

test('opłacona sesja: zamówienie jest oznaczone jako opłacone i wysyłane jest jedno potwierdzenie', async () => {
  const order = await newOrder('req-paid-0001', 'cs_test_paid_1');
  const response = await POST(
    signedRequest('evt_paid_1', 'checkout.session.completed', sessionObject(order.id, 'cs_test_paid_1', 36400)),
  );
  assert.equal(response.status, 200);

  const stored = await orders.getOrder(order.id);
  assert.equal(stored?.status, 'paid');
  assert.equal(stored?.stripePaymentIntentId, 'pi_test_1');
  assert.ok(stored?.emails.confirmationSentAt);
  assert.equal(stored?.shipment.status, 'waiting_for_config', 'bez danych InPost przesyłka czeka na konfigurację');
  assert.equal(await outboxCount(), 1);
});

test('to samo zdarzenie drugi raz nie wysyła kolejnego e-maila ani nie zmienia stanu', async () => {
  const order = await newOrder('req-dup-0001', 'cs_test_dup_1');
  const before = await outboxCount();
  const first = await POST(signedRequest('evt_dup_1', 'checkout.session.completed', sessionObject(order.id, 'cs_test_dup_1', 36400)));
  const afterFirst = await outboxCount();
  const second = await POST(signedRequest('evt_dup_1', 'checkout.session.completed', sessionObject(order.id, 'cs_test_dup_1', 36400)));
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal((await second.json()).duplicate, true);
  assert.equal(afterFirst, before + 1);
  assert.equal(await outboxCount(), afterFirst);
});

test('inne zdarzenie dla już opłaconej sesji nie powiela potwierdzenia', async () => {
  const order = await newOrder('req-async-0001', 'cs_test_async_1');
  const before = await outboxCount();
  await POST(signedRequest('evt_async_1', 'checkout.session.completed', sessionObject(order.id, 'cs_test_async_1', 36400)));
  const afterFirst = await outboxCount();
  await POST(signedRequest('evt_async_2', 'checkout.session.async_payment_succeeded', sessionObject(order.id, 'cs_test_async_1', 36400)));
  const afterSecond = await outboxCount();
  assert.equal(afterFirst, before + 1);
  assert.equal(afterSecond, afterFirst, 'potwierdzenie nie może być wysłane dwa razy');
});

test('kwota różna od zamówienia oznacza weryfikację, bez realizacji', async () => {
  const order = await newOrder('req-mismatch-0001', 'cs_test_mismatch_1');
  const before = await outboxCount();
  const response = await POST(
    signedRequest('evt_mismatch_1', 'checkout.session.completed', sessionObject(order.id, 'cs_test_mismatch_1', 100)),
  );
  assert.equal(response.status, 200);
  const stored = await orders.getOrder(order.id);
  assert.equal(stored?.status, 'payment_mismatch');
  assert.equal(stored?.emails.confirmationSentAt, null);
  assert.equal(await outboxCount(), before, 'nie wysyłamy potwierdzenia dla niezgodnej kwoty');
});

test('sesja nieopłacona nie zmienia zamówienia', async () => {
  const order = await newOrder('req-unpaid-0001', 'cs_test_unpaid_1');
  await POST(
    signedRequest('evt_unpaid_1', 'checkout.session.completed', sessionObject(order.id, 'cs_test_unpaid_1', 36400, 'unpaid')),
  );
  const stored = await orders.getOrder(order.id);
  assert.equal(stored?.status, 'pending_payment');
});

test('wygasła sesja oznacza zamówienie jako wygasłe, a opłacone zostaje opłacone', async () => {
  const pending = await newOrder('req-expire-0001', 'cs_test_expire_1');
  await POST(signedRequest('evt_expire_1', 'checkout.session.expired', sessionObject(pending.id, 'cs_test_expire_1', 36400, 'unpaid')));
  assert.equal((await orders.getOrder(pending.id))?.status, 'expired');

  const paid = await newOrder('req-expire-0002', 'cs_test_expire_2');
  await POST(signedRequest('evt_paid_2', 'checkout.session.completed', sessionObject(paid.id, 'cs_test_expire_2', 36400)));
  await POST(signedRequest('evt_expire_2', 'checkout.session.expired', sessionObject(paid.id, 'cs_test_expire_2', 36400, 'unpaid')));
  assert.equal((await orders.getOrder(paid.id))?.status, 'paid');
});

test('ten sam clientRequestId zwraca to samo zamówienie (brak duplikatu)', async () => {
  const first = await newOrder('req-idem-0001', 'cs_test_idem_1');
  const again = await orders.createOrder({
    clientRequestId: 'req-idem-0001',
    packageId: 'single',
    quantity: 1,
    currency: 'PLN',
    unitGrosz: 19900,
    productGrosz: 19900,
    shippingGrosz: 0,
    totalGrosz: 19900,
    deliveryMethod: 'paczkomat',
    paczkomatId: 'KRA010',
    address: null,
    contact: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna.pl', phone: '512345678' },
  });
  assert.equal(again.created, false);
  assert.equal(again.order.id, first.id);
});

test('przesyłka jest rezerwowana tylko raz', async () => {
  const order = await newOrder('req-claim-0001', 'cs_test_claim_1');
  const first = await orders.claimShipment(order.id, 300_000);
  const second = await orders.claimShipment(order.id, 300_000);
  assert.ok(first);
  assert.equal(second, null);
});
