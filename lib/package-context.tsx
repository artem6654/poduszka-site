'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PACKAGE_ID, isPackageId, type PackageId } from '@/lib/pricing';

type PackageSelection = {
  selected: PackageId;
  select: (id: PackageId) => void;
};

const PackageSelectionContext = createContext<PackageSelection | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Wartość z serwera (np. z adresu strony zamówienia). Jeśli podana, nie czytamy adresu w przeglądarce. */
  initial?: PackageId;
};

/**
 * Wspólny stan wyboru wariantu dla galerii, panelu zakupu, paska mobilnego i zamówienia.
 * Wybór jest zapisany w adresie (?pakiet=…), więc przetrwa odświeżenie i trafia do kasy.
 */
export function PackageSelectionProvider({ children, initial }: ProviderProps) {
  const [selected, setSelected] = useState<PackageId>(initial ?? DEFAULT_PACKAGE_ID);

  useEffect(() => {
    if (initial) return;
    const fromUrl = new URLSearchParams(window.location.search).get('pakiet');
    if (isPackageId(fromUrl)) setSelected(fromUrl);
  }, [initial]);

  const select = useCallback((id: PackageId) => {
    setSelected(id);
    const url = new URL(window.location.href);
    url.searchParams.set('pakiet', id);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const value = useMemo(() => ({ selected, select }), [selected, select]);

  return <PackageSelectionContext.Provider value={value}>{children}</PackageSelectionContext.Provider>;
}

export function usePackageSelection(): PackageSelection {
  const context = useContext(PackageSelectionContext);
  if (!context) {
    throw new Error('usePackageSelection musi być użyte wewnątrz PackageSelectionProvider.');
  }
  return context;
}
