import Link from 'next/link';
import { brand, business, product } from '@/config/store';

const pending = <span className="pending-value">do uzupełnienia</span>;

const legalLinks = [
  { href: '/informacje/dostawa', label: 'Dostawa' },
  { href: '/informacje/zwroty', label: 'Zwroty' },
  { href: '/informacje/prywatnosc', label: 'Polityka prywatności' },
  { href: '/informacje/regulamin', label: 'Regulamin' },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <p className="wordmark wordmark--footer">{brand.name}</p>
          <p className="footer-text">{product.name}.</p>
        </div>

        <nav className="footer-nav" aria-label="Informacje">
          <p className="footer-heading">Informacje</p>
          <ul>
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-business">
          <p className="footer-heading">Dane firmy</p>
          <dl>
            <div>
              <dt>Firma</dt>
              <dd>{business.legalName ?? pending}</dd>
            </div>
            <div>
              <dt>Adres</dt>
              <dd>{business.address ?? pending}</dd>
            </div>
            <div>
              <dt>NIP</dt>
              <dd>{business.taxId ?? pending}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{business.email ?? pending}</dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd>{business.phone ?? pending}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="wrap footer-bottom">
        <p>
          © {year} {brand.name}.{' '}
          {brand.status === 'draft' ? 'Wersja robocza, nie jest jeszcze uruchomiona do sprzedaży.' : null}
        </p>
      </div>
    </footer>
  );
}
