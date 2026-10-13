import type { Metadata } from 'next';
import { product } from '@/config/store';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { PackageSelectionProvider } from '@/lib/package-context';
import { DEFAULT_PACKAGE_ID, isPackageId } from '@/lib/pricing';
import { getIntegrationStatus } from '@/lib/server/integrations';

export const metadata: Metadata = {
  title: 'Zamówienie',
  description: 'Dane do zamówienia i płatność.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type CheckoutPageProps = {
  searchParams: Promise<{ pakiet?: string | string[]; platnosc?: string | string[] }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const rawPackage = Array.isArray(params.pakiet) ? params.pakiet[0] : params.pakiet;
  const initial = isPackageId(rawPackage) ? rawPackage : DEFAULT_PACKAGE_ID;
  const cancelled = (Array.isArray(params.platnosc) ? params.platnosc[0] : params.platnosc) === 'anulowana';
  const { payments } = getIntegrationStatus();

  return (
    <PackageSelectionProvider initial={initial}>
      <SiteHeader />
      <main className="checkout">
        <div className="wrap">
          <header className="checkout-head">
            <p className="eyebrow">Zamówienie</p>
            <h1 className="h2">{product.shortName}</h1>
            <p className="body">Podaj dane kontaktowe i sposób dostawy. Wariant możesz zmienić w podsumowaniu.</p>
          </header>
          <CheckoutForm paymentsConfigured={payments} cancelled={cancelled} />
        </div>
      </main>
      <SiteFooter />
    </PackageSelectionProvider>
  );
}
