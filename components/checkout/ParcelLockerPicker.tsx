'use client';

import { createElement, useEffect, useRef } from 'react';
import Script from 'next/script';

export type SelectedPoint = { id: string; description: string | null };

type Props = {
  value: SelectedPoint | null;
  onChange: (point: SelectedPoint) => void;
  disabled?: boolean;
};

/** Publiczny token Geowidget z Parcel Managera. Jest widoczny w przeglądarce z założenia. */
const TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? '';

/**
 * Wybór paczkomatu przez oficjalny InPost Geowidget. Bez tokenu pokazujemy komunikat,
 * a nie pustą mapę. Zdarzenie wyboru nazwa `onpointselect`; wymaga sprawdzenia w sandboksie InPost.
 */
export function ParcelLockerPicker({ value, onChange, disabled = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!TOKEN) return;

    const handlePick = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail as
        | { name?: unknown; address?: { line1?: unknown; line2?: unknown } }
        | null
        | undefined;
      const name = typeof detail?.name === 'string' ? detail.name.trim() : '';
      if (!name) return;

      const description =
        [detail?.address?.line1, detail?.address?.line2]
          .filter((part): part is string => typeof part === 'string' && part.length > 0)
          .join(', ') || null;

      onChangeRef.current({ id: name.toUpperCase(), description });
      dialogRef.current?.close();
    };

    document.addEventListener('onpointselect', handlePick);
    return () => document.removeEventListener('onpointselect', handlePick);
  }, []);

  if (!TOKEN) {
    return (
      <div className="picker-missing" role="status">
        <p>
          Wybór paczkomatu wymaga tokenu InPost Geowidget (NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN). Dopóki token nie jest
          ustawiony, mapa nie działa i nie można wybrać punktu.
        </p>
      </div>
    );
  }

  return (
    <div className="picker">
      <link rel="stylesheet" href="https://geowidget.inpost.pl/inpost-geowidget.css" precedence="default" />
      <Script src="https://geowidget.inpost.pl/inpost-geowidget.js" strategy="lazyOnload" />

      <div className="picker-row">
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => dialogRef.current?.showModal()}
          disabled={disabled}
        >
          {value ? 'Zmień paczkomat' : 'Wybierz paczkomat na mapie'}
        </button>
        {value && (
          <p className="picker-selected">
            Wybrany punkt: <strong>{value.id}</strong>
            {value.description && <span>{value.description}</span>}
          </p>
        )}
      </div>

      <dialog ref={dialogRef} className="picker-dialog" aria-label="Mapa paczkomatów InPost">
        <div className="picker-dialog-head">
          <p>Wybierz paczkomat</p>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => dialogRef.current?.close()}>
            Zamknij
          </button>
        </div>
        {createElement('inpost-geowidget', { token: TOKEN, language: 'pl', config: 'parcelCollect' })}
      </dialog>
    </div>
  );
}
