import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { infoPages } from '@/config/store';

type InfoSlug = keyof typeof infoPages;

type InfoPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return (Object.keys(infoPages) as InfoSlug[]).map((slug) => ({ slug }));
}

function isInfoSlug(slug: string): slug is InfoSlug {
  return Object.prototype.hasOwnProperty.call(infoPages, slug);
}

export async function generateMetadata({ params }: InfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isInfoSlug(slug)) return { title: 'Nie znaleziono' };
  return { title: infoPages[slug].title, description: infoPages[slug].intro };
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params;
  if (!isInfoSlug(slug)) notFound();

  const page = infoPages[slug];

  return (
    <>
      <SiteHeader />
      <main className="info-page">
        <div className="wrap info-inner">
          <p className="eyebrow">Informacje</p>
          <h1 className="h2">{page.title}</h1>
          <p className="lead">{page.intro}</p>
          <p className="body">
            Ta podstrona nie jest jeszcze gotowa do publikacji. Treść zostanie uzupełniona przed uruchomieniem
            sprzedaży.
          </p>
          <p>
            <Link href="/" className="link-line">
              Wróć na stronę główną
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
