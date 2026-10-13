'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { gallery, media } from '@/config/store';
import { DimensionDiagram } from '@/components/DimensionDiagram';

const total = gallery.length;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Następny albo poprzedni slajd będący zdjęciem (wideo i wymiary nie otwierają powiększenia). */
function neighbourImage(from: number, direction: 1 | -1): number | null {
  for (let index = from + direction; index >= 0 && index < total; index += direction) {
    if (gallery[index].kind === 'image') return index;
  }
  return null;
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d={direction === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Galeria produktu: przewijanie dotykiem (scroll-snap), miniatury, strzałki, film i powiększenie.
 * Miniatury i strzałki są zsynchronizowane z pozycją przewijania. Powiększenie to natywne `<dialog>`.
 */
export function ProductGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef(0);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState<number | null>(null);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setActive(index);
  }, []);

  const onScroll = () => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      const track = trackRef.current;
      if (!track) return;
      const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      setActive(Math.min(total - 1, Math.max(0, index)));
    });
  };

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (zoomed !== null && !dialog.open) dialog.showModal();
    if (zoomed === null && dialog.open) dialog.close();
  }, [zoomed]);

  const onLightboxKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (zoomed === null) return;
    if (event.key === 'ArrowRight') {
      const next = neighbourImage(zoomed, 1);
      if (next !== null) setZoomed(next);
    }
    if (event.key === 'ArrowLeft') {
      const previous = neighbourImage(zoomed, -1);
      if (previous !== null) setZoomed(previous);
    }
  };

  const zoomedItem = zoomed !== null ? gallery[zoomed] : null;
  const nextImage = zoomed !== null ? neighbourImage(zoomed, 1) : null;
  const previousImage = zoomed !== null ? neighbourImage(zoomed, -1) : null;

  return (
    <div className="gallery">
      <div className="gallery-stage">
        <div
          ref={trackRef}
          className="gallery-track"
          onScroll={onScroll}
          role="region"
          aria-roledescription="karuzela"
          aria-label="Galeria produktu"
          tabIndex={0}
        >
          {gallery.map((item, index) => (
            <figure key={item.id} className="gallery-slide" aria-roledescription="slajd" aria-label={`${index + 1} z ${total}: ${item.caption}`}>
              <div className="gallery-frame">
                {item.kind === 'image' && (
                  <>
                    <img
                      className="gallery-media"
                      src={item.src}
                      width={item.width}
                      height={item.height}
                      alt={item.alt}
                      sizes="(min-width: 960px) 52vw, 100vw"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : undefined}
                    />
                    <button type="button" className="gallery-zoom" onClick={() => setZoomed(index)}>
                      Powiększ
                    </button>
                  </>
                )}
                {item.kind === 'video' && (
                  <video
                    className="gallery-media gallery-media--video"
                    controls
                    playsInline
                    preload="none"
                    poster={item.poster}
                    width={item.width}
                    height={item.height}
                    aria-label={item.alt}
                  >
                    <source src={item.webm} type="video/webm" />
                    <source src={item.src} type="video/mp4" />
                    Twoja przeglądarka nie odtwarza tego wideo.
                  </video>
                )}
                {item.kind === 'diagram' && (
                  <div className="gallery-diagram">
                    <DimensionDiagram />
                  </div>
                )}
              </div>
            </figure>
          ))}
        </div>

        <button
          type="button"
          className="gallery-arrow gallery-arrow--prev"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Poprzednie zdjęcie"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          className="gallery-arrow gallery-arrow--next"
          onClick={() => goTo(Math.min(total - 1, active + 1))}
          disabled={active === total - 1}
          aria-label="Następne zdjęcie"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <p className="gallery-caption" aria-live="polite">
        {gallery[active].caption}, {active + 1} z {total}
      </p>

      <div className="gallery-thumbs" role="group" aria-label="Miniatury zdjęć">
        {gallery.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="gallery-thumb"
            aria-label={`Pokaż: ${item.caption}`}
            aria-current={index === active ? 'true' : undefined}
            onClick={() => goTo(index)}
          >
            {item.kind === 'diagram' ? (
              <span className="gallery-thumb-text" aria-hidden="true">
                63 × 41
              </span>
            ) : (
              <img src={item.thumb} width={112} height={112} alt="" loading="lazy" />
            )}
            {item.kind === 'video' && <span className="gallery-thumb-badge">Film</span>}
          </button>
        ))}
      </div>

      {!media.photosVerified && (
        <p className="gallery-note">
          Zdjęcia są grafikami poglądowymi i nie przedstawiają dokładnie tego egzemplarza. Prawdziwe zdjęcia produktu
          zostaną dodane przed sprzedażą.
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={zoomedItem?.kind === 'image' ? zoomedItem.alt : 'Powiększone zdjęcie'}
        onClose={() => setZoomed(null)}
        onKeyDown={onLightboxKey}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        {zoomedItem?.kind === 'image' && zoomed !== null && (
          <div className="lightbox-inner">
            <button type="button" className="lightbox-close" onClick={() => dialogRef.current?.close()} aria-label="Zamknij powiększenie">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </button>
            <img src={zoomedItem.src} width={zoomedItem.width} height={zoomedItem.height} alt={zoomedItem.alt} />
            <div className="lightbox-nav">
              <button
                type="button"
                onClick={() => previousImage !== null && setZoomed(previousImage)}
                disabled={previousImage === null}
                aria-label="Poprzednie zdjęcie"
              >
                <Chevron direction="left" />
              </button>
              <p>{zoomedItem.caption}</p>
              <button
                type="button"
                onClick={() => nextImage !== null && setZoomed(nextImage)}
                disabled={nextImage === null}
                aria-label="Następne zdjęcie"
              >
                <Chevron direction="right" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
