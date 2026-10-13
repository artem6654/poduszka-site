import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals, normalizePhone, parseCheckoutInput } from '../lib/checkout';
import { formatPLN } from '../lib/pricing';

const validContact = { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.pl', phone: '+48 512 345 678' };
const validBase = {
  packageId: 'bundle',
  clientRequestId: 'req-test-0001',
  contact: validContact,
  consent: true,
};

test('zestaw: 349 zł to 17 450 gr za sztukę i 34 900 gr łącznie', () => {
  const totals = computeTotals('bundle', 'paczkomat', 15);
  assert.ok(totals);
  assert.equal(totals.quantity, 2);
  assert.equal(totals.productGrosz, 34900);
  assert.equal(totals.unitGrosz, 17450);
  assert.equal(totals.shippingGrosz, 1500);
  assert.equal(totals.totalGrosz, 36400);
});

test('pojedyncza poduszka: 199 zł, bez oszczędności', () => {
  const totals = computeTotals('single', 'kurier', 20);
  assert.ok(totals);
  assert.equal(totals.quantity, 1);
  assert.equal(totals.unitGrosz, 19900);
  assert.equal(totals.totalGrosz, 21900);
});

test('bez skonfigurowanej ceny dostawy nie ma kwoty do zapłaty', () => {
  assert.equal(computeTotals('bundle', 'paczkomat', null), null);
});

test('formatowanie: pełne złote bez groszy, 174,50 zł z groszami', () => {
  assert.equal(formatPLN(199), '199 zł');
  assert.equal(formatPLN(174.5), '174,50 zł');
});

test('normalizacja telefonu usuwa prefiks +48 i odstępy', () => {
  assert.equal(normalizePhone('+48 512-345-678'), '512345678');
  assert.equal(normalizePhone('0048512345678'), '512345678');
});

test('poprawne dane paczkomatu przechodzą walidację', () => {
  const result = parseCheckoutInput({ ...validBase, delivery: { method: 'paczkomat', paczkomatId: 'kra010' } });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.delivery.method, 'paczkomat');
  assert.equal(result.value.delivery.method === 'paczkomat' && result.value.delivery.paczkomatId, 'KRA010');
  assert.equal(result.value.contact.phone, '512345678');
  assert.equal(result.value.contact.email, 'anna@example.pl');
});

test('kurier wymaga pełnego adresu z kodem pocztowym', () => {
  const result = parseCheckoutInput({
    ...validBase,
    delivery: { method: 'kurier', address: { street: 'Długa', buildingNumber: '5', postCode: '00-001', city: 'Warszawa' } },
  });
  assert.equal(result.ok, true);

  const bad = parseCheckoutInput({
    ...validBase,
    delivery: { method: 'kurier', address: { street: 'Długa', buildingNumber: '5', postCode: '00001', city: 'Warszawa' } },
  });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.ok(bad.errors.postCode);
});

test('bez zgody na regulamin zamówienie jest odrzucane', () => {
  const result = parseCheckoutInput({ ...validBase, consent: false, delivery: { method: 'paczkomat', paczkomatId: 'KRA010' } });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.consent);
});

test('nieznany wariant i niepoprawny e-mail są zgłaszane przy polach', () => {
  const result = parseCheckoutInput({
    ...validBase,
    packageId: 'ten-z-adresu',
    contact: { ...validContact, email: 'nie-email' },
    delivery: { method: 'paczkomat', paczkomatId: 'KRA010' },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.packageId);
    assert.ok(result.errors.email);
  }
});

test('cena nie może być przekazana przez klienta: walidacja ignoruje pola kwot', () => {
  const result = parseCheckoutInput({
    ...validBase,
    totalGrosz: 100,
    amount: 1,
    delivery: { method: 'paczkomat', paczkomatId: 'KRA010' },
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal('totalGrosz' in result.value, false);
});
