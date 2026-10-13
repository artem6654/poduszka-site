import { packageCopy, pricing } from '@/config/store';

export type PackageId = 'single' | 'bundle';

export const PACKAGE_IDS: readonly PackageId[] = ['single', 'bundle'];

/** Wariant pokazany jako domyślnie zaznaczony: zestaw jest oznaczony jako polecany. */
export const DEFAULT_PACKAGE_ID: PackageId = 'bundle';

export function isPackageId(value: unknown): value is PackageId {
  return value === 'single' || value === 'bundle';
}

export type PackageQuote = {
  id: PackageId;
  title: string;
  ctaLabel: string;
  quantity: number;
  /** Łączna cena wariantu. */
  total: number;
  /** Cena przypadająca na jedną poduszkę w tym wariancie. */
  unitPrice: number;
  /** Oszczędność względem zakupu pojedynczych sztuk w tej samej liczbie. */
  savings: number;
};

/** Wylicza wszystkie wartości wariantu z danych w `config/store.ts`. */
export function getQuote(id: PackageId): PackageQuote {
  const quantity = id === 'single' ? 1 : pricing.bundleQuantity;
  const total = id === 'single' ? pricing.singlePrice : pricing.bundlePrice;
  const priceOfSingles = quantity * pricing.singlePrice;

  return {
    id,
    title: packageCopy[id].title,
    ctaLabel: packageCopy[id].ctaLabel,
    quantity,
    total,
    unitPrice: total / quantity,
    savings: priceOfSingles - total,
  };
}

const formatWhole = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const formatWithCents = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 199 → „199 zł”, 174.5 → „174,50 zł”. Spacja przed „zł” jest twarda. */
export function formatPLN(amount: number): string {
  const formatter = Number.isInteger(amount) ? formatWhole : formatWithCents;
  return `${formatter.format(amount)} zł`;
}

/** Tekst podsumowania do schowka i na stronie zamówienia. */
export function summaryText(quote: PackageQuote, productName: string): string {
  const savings = quote.savings > 0 ? `, oszczędność ${formatPLN(quote.savings)}` : '';
  return `${productName}: ${quote.title} (${quote.quantity} szt.), razem ${formatPLN(quote.total)}${savings}.`;
}
