import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Instrument_Serif } from 'next/font/google';
import type { ReactNode } from 'react';
import { brand, product, siteUrl } from '@/config/store';
import { formatPLN, getQuote } from '@/lib/pricing';
import './globals.css';

const serif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--f-serif',
  display: 'swap',
});

const sans = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--f-sans',
  display: 'swap',
});

const { length, width, height } = product.dimensionsCm;
const single = getQuote('single');
const bundle = getQuote('bundle');

const description = `${product.description} Wymiary ${length} × ${width} × ${height} cm, zdejmowany pokrowiec. Jedna sztuka za ${formatPLN(single.total)}, zestaw dwóch za ${formatPLN(bundle.total)}.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${product.name} | ${brand.name}`,
    template: `%s | ${brand.name}`,
  },
  description,
  applicationName: brand.name,
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: brand.name,
    title: `${product.shortName}: poduszka z pianką memory | ${brand.name}`,
    description,
    images: [
      {
        url: '/images/hero-bedroom-square.webp',
        width: 1024,
        height: 1024,
        alt: `${product.shortName} na łóżku w jasnej sypialni. Grafika poglądowa.`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${product.shortName}: poduszka z pianką memory | ${brand.name}`,
    description,
    images: ['/images/hero-bedroom-square.webp'],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#F5F0E7',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
        {children}
      </body>
    </html>
  );
}
