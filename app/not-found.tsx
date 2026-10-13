import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="info-page">
      <div className="wrap info-inner">
        <p className="eyebrow">Błąd 404</p>
        <h1 className="h2">Tej strony nie ma.</h1>
        <p className="body">Adres mógł się zmienić albo wystąpił błąd w linku.</p>
        <p>
          <Link href="/" className="btn">
            Wróć na stronę główną
          </Link>
        </p>
      </div>
    </main>
  );
}
