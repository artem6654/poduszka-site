import type Stripe from 'stripe';
import { getStripe } from '@/lib/server/integrations';
import { fulfillPaidOrder } from '@/lib/server/fulfillment';
import { getOrder, markEventProcessed, unmarkEventProcessed, updateOrder } from '@/lib/server/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook Stripe. Tylko on potwierdza płatność: przekierowanie na stronę sukcesu nic nie zmienia.
 * Podpis jest sprawdzany przed jakimkolwiek działaniem, a każde zdarzenie przetwarzane jest raz.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ error: 'webhooks_not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return Response.json({ error: 'missing_signature' }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const firstTime = await markEventProcessed(event.id);
  if (!firstTime) return Response.json({ received: true, duplicate: true });

  try {
    await handleEvent(event);
  } catch (error) {
    // Cofamy oznaczenie, żeby Stripe ponowił zdarzenie.
    await unmarkEventProcessed(event.id);
    console.error('[stripe webhook] processing failed', event.type, error);
    return Response.json({ error: 'processing_failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') await onPaid(session);
      return;
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) return;
      await updateOrder(orderId, (order) => {
        if (order.status === 'pending_payment') order.status = 'expired';
      });
      return;
    }
    default:
      return;
  }
}

async function onPaid(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;

  const order = await getOrder(orderId);
  if (!order) return;

  // Kwota i waluta muszą zgadzać się z zamówieniem zapisanym po stronie serwera.
  const amountMatches = session.amount_total === order.totalGrosz && session.currency === 'pln';
  if (!amountMatches) {
    await updateOrder(orderId, (o) => {
      o.status = 'payment_mismatch';
    });
    console.error('[stripe webhook] amount mismatch', order.number, session.amount_total, order.totalGrosz);
    return;
  }

  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null);

  await updateOrder(orderId, (o) => {
    if (o.status !== 'paid') {
      o.status = 'paid';
      o.paidAt = new Date().toISOString();
    }
    o.stripePaymentIntentId = paymentIntent ?? o.stripePaymentIntentId;
  });

  await fulfillPaidOrder(orderId);
}
