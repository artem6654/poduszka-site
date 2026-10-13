import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CheckoutAddress, CheckoutContact, DeliveryMethod } from '@/lib/checkout';
import type { PackageId } from '@/lib/pricing';

/**
 * Magazyn zamówień oparty na pliku JSON. Wystarcza do rozwoju i testów na jednej instancji.
 * Przed produkcją trzeba przenieść go do bazy z transakcjami (np. Postgres).
 * Każda operacja przechodzi przez jedną kolejkę, więc odczyt–zapis nie przeplatają się w procesie.
 */

export type OrderStatus = 'pending_payment' | 'paid' | 'expired' | 'payment_mismatch';

export type ShipmentState = {
  status: 'not_created' | 'creating' | 'waiting_for_config' | 'created' | 'failed';
  inpostShipmentId: string | null;
  trackingNumber: string | null;
  error: string | null;
  startedAt: string | null;
};

export type Order = {
  id: string;
  number: string;
  clientRequestId: string;
  createdAt: string;
  updatedAt: string;
  packageId: PackageId;
  quantity: number;
  currency: 'PLN';
  unitGrosz: number;
  productGrosz: number;
  shippingGrosz: number;
  totalGrosz: number;
  deliveryMethod: DeliveryMethod;
  paczkomatId: string | null;
  address: CheckoutAddress | null;
  contact: CheckoutContact;
  status: OrderStatus;
  stripeSessionId: string | null;
  redirectUrl: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  emails: { confirmationSentAt: string | null; trackingSentAt: string | null };
  shipment: ShipmentState;
};

type StoreFile = {
  orders: Record<string, Order>;
  processedEvents: Record<string, string>;
};

function storePath(): string {
  return process.env.ORDER_STORE_PATH ?? path.join(process.cwd(), '.data', 'orders.json');
}

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(/*turbopackIgnore: true*/ storePath(), 'utf8');
    return JSON.parse(raw) as StoreFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { orders: {}, processedEvents: {} };
    }
    throw error;
  }
}

async function writeStore(data: StoreFile): Promise<void> {
  const file = storePath();
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(/*turbopackIgnore: true*/ tmp, file);
}

/** Wykonuje odczyt–modyfikację–zapis jako jedną operację. */
async function mutate<T>(fn: (data: StoreFile) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const data = await readStore();
    const result = await fn(data);
    await writeStore(data);
    return result;
  });
}

async function read<T>(fn: (data: StoreFile) => T): Promise<T> {
  return withLock(async () => fn(await readStore()));
}

export type NewOrder = Omit<Order, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'status' | 'stripeSessionId' | 'redirectUrl' | 'stripePaymentIntentId' | 'paidAt' | 'emails' | 'shipment'> & {
  clientRequestId: string;
};

function orderNumber(id: string): string {
  return `JX-${id.slice(0, 8).toUpperCase()}`;
}

/**
 * Tworzy zamówienie w statusie `pending_payment`. Jeśli ten sam `clientRequestId` już istnieje
 * (np. podwójne kliknięcie), zwraca istniejące zamówienie zamiast tworzyć duplikat.
 */
export async function createOrder(input: NewOrder): Promise<{ order: Order; created: boolean }> {
  return mutate((data) => {
    const existing = Object.values(data.orders).find((order) => order.clientRequestId === input.clientRequestId);
    if (existing) return { order: existing, created: false };

    const id = randomUUID();
    const now = new Date().toISOString();
    const order: Order = {
      ...input,
      id,
      number: orderNumber(id),
      createdAt: now,
      updatedAt: now,
      status: 'pending_payment',
      stripeSessionId: null,
      redirectUrl: null,
      stripePaymentIntentId: null,
      paidAt: null,
      emails: { confirmationSentAt: null, trackingSentAt: null },
      shipment: {
        status: 'not_created',
        inpostShipmentId: null,
        trackingNumber: null,
        error: null,
        startedAt: null,
      },
    };
    data.orders[id] = order;
    return { order, created: true };
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  return read((data) => data.orders[id] ?? null);
}

export async function findOrderBySession(sessionId: string): Promise<Order | null> {
  return read((data) => Object.values(data.orders).find((order) => order.stripeSessionId === sessionId) ?? null);
}

/** Aktualizuje zamówienie. Zwraca `null`, gdy zamówienia nie ma. */
export async function updateOrder(id: string, change: (order: Order) => void): Promise<Order | null> {
  return mutate((data) => {
    const order = data.orders[id];
    if (!order) return null;
    change(order);
    order.updatedAt = new Date().toISOString();
    return order;
  });
}

/** Zwraca `true` tylko przy pierwszym zapisaniu zdarzenia Stripe. Chroni przed podwójnym przetworzeniem. */
export async function markEventProcessed(eventId: string): Promise<boolean> {
  return mutate((data) => {
    if (data.processedEvents[eventId]) return false;
    data.processedEvents[eventId] = new Date().toISOString();
    return true;
  });
}

/** Cofa oznaczenie zdarzenia, gdy przetwarzanie się nie powiodło, żeby Stripe mógł je ponowić. */
export async function unmarkEventProcessed(eventId: string): Promise<void> {
  await mutate((data) => {
    delete data.processedEvents[eventId];
  });
}

/**
 * Atomowo rezerwuje tworzenie przesyłki. Zwraca kopię zamówienia, jeśli rezerwacja się udała.
 * Zwraca `null`, gdy przesyłka już istnieje albo inny proces właśnie ją tworzy.
 */
export async function claimShipment(id: string, staleAfterMs: number): Promise<Order | null> {
  return mutate((data) => {
    const order = data.orders[id];
    if (!order) return null;
    const shipment = order.shipment;
    if (shipment.status === 'created') return null;
    if (
      shipment.status === 'creating' &&
      shipment.startedAt &&
      Date.now() - Date.parse(shipment.startedAt) < staleAfterMs
    ) {
      return null;
    }
    const now = new Date().toISOString();
    shipment.status = 'creating';
    shipment.startedAt = now;
    shipment.error = null;
    order.updatedAt = now;
    return structuredClone(order);
  });
}
