import { sendMail } from '@/lib/server/email';
import { confirmationMail, trackingMail } from '@/lib/server/emails';
import { createInpostShipment, inpostReadiness } from '@/lib/server/inpost';
import { claimShipment, getOrder, updateOrder } from '@/lib/server/orders';

/** Po czasie, po którym rezerwację „creating” uznajemy za porzuconą (np. po awarii procesu). */
const STALE_CLAIM_MS = 5 * 60 * 1000;

export type FulfillmentOutcome =
  | 'not_paid'
  | 'shipment_created'
  | 'shipment_already_handled'
  | 'shipment_waiting_for_config';

/**
 * Wykonywane po potwierdzonej płatności. Każdy krok jest idempotentny:
 * e-mail z potwierdzeniem i przesyłka powstają co najwyżej raz, nawet przy ponowionym webhooku.
 * Błąd tworzenia przesyłki jest rzucany dalej, żeby Stripe ponowił webhook.
 */
export async function fulfillPaidOrder(orderId: string): Promise<FulfillmentOutcome> {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Nie znaleziono zamówienia ${orderId}.`);
  if (order.status !== 'paid') return 'not_paid';

  if (!order.emails.confirmationSentAt) {
    await sendMail(confirmationMail(order));
    await updateOrder(orderId, (o) => {
      o.emails.confirmationSentAt = new Date().toISOString();
    });
  }

  if (order.shipment.status === 'created') return 'shipment_already_handled';

  const readiness = inpostReadiness();
  if (!readiness.ready) {
    await updateOrder(orderId, (o) => {
      o.shipment.status = 'waiting_for_config';
      o.shipment.error = readiness.reason;
    });
    return 'shipment_waiting_for_config';
  }

  const claimed = await claimShipment(orderId, STALE_CLAIM_MS);
  if (!claimed) return 'shipment_already_handled';

  try {
    const result = await createInpostShipment(claimed);
    await updateOrder(orderId, (o) => {
      o.shipment = {
        status: 'created',
        inpostShipmentId: result.inpostShipmentId,
        trackingNumber: result.trackingNumber,
        error: null,
        startedAt: null,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateOrder(orderId, (o) => {
      o.shipment.status = 'failed';
      o.shipment.error = message;
      o.shipment.startedAt = null;
    });
    throw error;
  }

  const afterShipment = await getOrder(orderId);
  const tracking = afterShipment?.shipment.trackingNumber;
  if (afterShipment && tracking && !afterShipment.emails.trackingSentAt) {
    await sendMail(trackingMail(afterShipment, tracking));
    await updateOrder(orderId, (o) => {
      o.emails.trackingSentAt = new Date().toISOString();
    });
  }

  return 'shipment_created';
}
