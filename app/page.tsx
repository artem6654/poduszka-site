import type { Metadata } from 'next';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { BenefitStrip } from '@/components/BenefitStrip';
import { CinematicVideo } from '@/components/CinematicVideo';
import { EverydayComfort } from '@/components/EverydayComfort';
import { FaqAccordion } from '@/components/FaqAccordion';
import { Features } from '@/components/Features';
import { FinalPurchase } from '@/components/FinalPurchase';
import { MobileBuyBar } from '@/components/MobileBuyBar';
import { PackageComparison } from '@/components/PackageComparison';
import { Reveal } from '@/components/Reveal';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { Specifications } from '@/components/Specifications';
import { StorySection } from '@/components/StorySection';
import { TrustService } from '@/components/TrustService';
import { ProductHero } from '@/components/product/ProductHero';
import { product, siteUrl } from '@/config/store';
import { PackageSelectionProvider } from '@/lib/package-context';
import { getQuote } from '@/lib/pricing';
import { getIntegrationStatus } from '@/lib/server/integrations';

export const metadata: Metadata = {
  title: { absolute: `${product.name} | Sonno` },
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

/** Dane produktu dla wyszukiwarek. Ceny i wymiary pochodzą z tej samej konfiguracji co strona. */
function productJsonLd() {
  const single = getQuote('single');
  const bundle = getQuote('bundle');
  const { length, width, height } = product.dimensionsCm;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    gtin13: product.ean,
    color: product.colour,
    material: 'Pianka PU Memory Foam',
    image: [`${siteUrl}/images/hero-bedroom-square.webp`],
    weight: { '@type': 'QuantitativeValue', value: product.weightKg, unitCode: 'KGM' },
    width: { '@type': 'QuantitativeValue', value: width, unitCode: 'CMT' },
    height: { '@type': 'QuantitativeValue', value: height, unitCode: 'CMT' },
    depth: { '@type': 'QuantitativeValue', value: length, unitCode: 'CMT' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PLN',
      lowPrice: single.total,
      highPrice: bundle.total,
      offerCount: 2,
    },
  };
}

export default function HomePage() {
  const { payments } = getIntegrationStatus();
  const jsonLd = JSON.stringify(productJsonLd()).replace(/</g, '\\u003c');

  return (
    <PackageSelectionProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <AnnouncementBar />
      <SiteHeader />

      <main>
        <ProductHero paymentsConfigured={payments} />
        <BenefitStrip />
        <StorySection />
        <Features />
        <CinematicVideo />
        <EverydayComfort />
        <PackageComparison />
        <Specifications />
        <TrustService paymentsConfigured={payments} />

        <section id="faq" className="section faq-section" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <Reveal className="faq-head">
              <p className="eyebrow">FAQ</p>
              <h2 id="faq-title" className="h2">
                Pytania o produkt i zakup.
              </h2>
              <p className="body">Jeśli brakuje Ci informacji, napisz do nas. Dane kontaktowe znajdziesz w stopce.</p>
            </Reveal>
            <Reveal delay={120}>
              <FaqAccordion paymentsConfigured={payments} />
            </Reveal>
          </div>
        </section>

        <FinalPurchase />
      </main>

      <SiteFooter />
      <MobileBuyBar />
    </PackageSelectionProvider>
  );
}
