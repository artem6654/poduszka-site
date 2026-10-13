import type Stripe from 'stripe';
import { checkout as checkoutConfig, packageCopy, product, shipping, siteUrl } from '@/config/store';
import { computeTotals, isDeliveryAvailable, parseCheckoutInput, type CheckoutInput, type Totals } from '@/lib/checkout';
import { getStripe } from '@/lib/server/integrations';
import { createOrder, updateOrder, type Order } from '@/lib/server/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function lineItems(input: CheckoutInput, totals: Totals): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: totals.quantity,
      price_data: {
        currency: checkoutConfig.currency,
        unit_amount: totals.unitGrosz,
        product_data: { name: `${product.shortName}, ${packageCopy[input.packageId].title}` },
      },
    },
  ];

  if (totals.shippingGrosz > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: checkoutConfig.currency,
        unit_amount: totals.shippingGrosz,
        product_data: { name: shipping[input.delivery.method].label },
      },
    });
  }
  return items;
}

/** Tworzy sesję Stripe Checkout dla zamówienia. Kwoty liczymy wyłącznie tutaj, na serwerze. */
async function createCheckoutSession(order: Order, input: CheckoutInput, totals: Totals, stripe: Stripe) {
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(30, checkoutConfig.sessionMinutes) * 60;
  const deliveryLabel = input.delivery.method === 'paczkomat' ? input.delivery.paczkomatId : 'kurier';

  return stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: lineItems(input, totals),
      customer_email: input.contact.email,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
        packageId: input.packageId,
        deliveryMethod: input.delivery.method,
        delivery: deliveryLabel,
      },
      payment_intent_data: {
        metadata: { orderId: order.id, orderNumber: order.number },
      },
      success_url: `${siteUrl}/zamowienie/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/zamowienie?pakiet=${input.packageId}&platnosc=anulowana`,
      locale: 'pl',
      expires_at: expiresAt,
      ...(process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION
        ? { payment_method_configuration: process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION }
        : {}),
    },
    // Ten sam klucz dla tego zamówienia: ponowienie nie utworzy drugiej sesji.
    { idempotencyKey: `checkout-session-${order.id}` },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json', message: 'Nieprawidłowe dane żądania.' }, 400);
  }

  const parsed = parseCheckoutInput(body);
  if (!parsed.ok) {
    return json({ error: 'validation', fields: parsed.errors }, 400);
  }
  const input = parsed.value;

  const stripe = getStripe();
  if (!stripe) {
    return json(
      {
        error: 'payments_not_configured',
        message: 'Płatności nie są jeszcze uruchomione. Zamówienie nie zostało złożone.',
      },
      503,
    );
  }

  const method = input.delivery.method;
  const totals = isDeliveryAvailable(method) ? computeTotals(input.packageId, method) : null;
  if (!totals) {
    return json(
      {
        error: 'shipping_not_configured',
        message: 'Ta metoda dostawy nie jest jeszcze skonfigurowana.',
      },
      409,
    );
  }

  const { order } = await createOrder({
    clientRequestId: input.clientRequestId,
    packageId: input.packageId,
    quantity: totals.quantity,
    currency: 'PLN',
    unitGrosz: totals.unitGrosz,
    productGrosz: totals.productGrosz,
    shippingGrosz: totals.shippingGrosz,
    totalGrosz: totals.totalGrosz,
    deliveryMethod: method,
    paczkomatId: input.delivery.method === 'paczkomat' ? input.delivery.paczkomatId : null,
    address: input.delivery.method === 'kurier' ? input.delivery.address : null,
    contact: input.contact,
  });

  // Ponowienie z tym samym clientRequestId musi dotyczyć tych samych danych, inaczej to konflikt.
  const sameOrder =
    order.packageId === input.packageId &&
    order.totalGrosz === totals.totalGrosz &&
    order.deliveryMethod === method &&
    order.contact.email === input.contact.email;
  if (!sameOrder) {
    return json({ error: 'conflict', message: 'Dane zamówienia się zmieniły. Odśwież stronę i spróbuj ponownie.' }, 409);
  }

  if (order.status !== 'pending_payment') {
    return json({ error: 'already_processed', orderId: order.id, status: order.status }, 409);
  }
  if (order.redirectUrl) {
    return json({ orderId: order.id, orderNumber: order.number, redirectUrl: order.redirectUrl, totals });
  }

  try {
    const session = await createCheckoutSession(order, input, totals, stripe);
    if (!session.url) throw new Error('Stripe nie zwrócił adresu płatności.');
    await updateOrder(order.id, (o) => {
      o.stripeSessionId = session.id;
      o.redirectUrl = session.url;
    });
    return json({ orderId: order.id, orderNumber: order.number, redirectUrl: session.url, totals });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nieznany błąd.';
    console.error('[checkout] Stripe session failed', order.number, message);
    return json(
      { error: 'stripe_error', message: 'Nie udało się przygotować płatności. Spróbuj ponownie za chwilę.' },
      502,
    );
  }
}
