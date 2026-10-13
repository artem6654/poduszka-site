import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'poduszka-route-'));
process.chdir(tmp);
process.env.ORDER_STORE_PATH = path.join(tmp, 'orders.json');

let POST: (request: Request) => Promise<Response>;

before(async () => {
  POST = (await import('../app/api/checkout/route')).POST;
});

const body = {
  packageId: 'bundle',
  clientRequestId: 'req-route-0001',
  contact: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.pl', phone: '512345678' },
  delivery: { method: 'paczkomat', paczkomatId: 'KRA010' },
  consent: true,
};

function post(payload: unknown): Request {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

test('bez klucza Stripe płatność nie jest udawana: odpowiedź 503 i brak zamówienia', async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const response = await POST(post(body));
  assert.equal(response.status, 503);
  const json = await response.json();
  assert.equal(json.error, 'payments_not_configured');
});

test('błędne dane zwracają 400 z polami, zanim cokolwiek zostanie zapisane', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
  const response = await POST(post({ ...body, contact: { ...body.contact, phone: '12' } }));
  assert.equal(response.status, 400);
  const json = await response.json();
  assert.equal(json.error, 'validation');
  assert.ok(json.fields.phone);
});

test('cena dostawy nieskonfigurowana: 409, bez kwoty i bez sesji', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
  const response = await POST(post(body));
  assert.equal(response.status, 409);
  const json = await response.json();
  assert.equal(json.error, 'shipping_not_configured');
});
