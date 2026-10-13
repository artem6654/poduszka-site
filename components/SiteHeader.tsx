'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { brand } from '@/config/store';

/** Linki z prefiksem „/”, żeby działały także na podstronach (np. /zamowienie). */
const navLinks = [
  { href: '/#produkt', label: 'Produkt' },
  { href: '/#korzysci', label: 'Korzyści' },
  { href: '/#szczegoly', label: 'Szczegóły' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled} data-menu-open={menuOpen}>
      <div className="wrap header-inner">
        <Link href="/" className="wordmark" aria-label={`${brand.name}, strona główna`}>
          {brand.name}
        </Link>

        <nav className="nav-desktop" aria-label="Główna nawigacja">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a href="/#wybor" className="btn btn--small">
            Wybierz poduszkę
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Zamknij menu' : 'Otwórz menu'}</span>
            <span className="menu-toggle-bars" aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav id="mobile-nav" className="nav-mobile" aria-label="Nawigacja mobilna" hidden={!menuOpen}>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className="nav-mobile-link" onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
