'use client';

import { useEffect, useRef, useState } from 'react';

const POSTER = '/images/hero-bedroom-16x9.webp';

/**
 * Film w tle sekcji. Poster jest widoczny od razu, a wideo ładuje się dopiero po wejściu w kadr.
 * Ruch zatrzymuje się poza ekranem i można go wstrzymać przyciskiem (WCAG 2.2.2).
 * Przy `prefers-reduced-motion` film nie startuje sam, tylko na żądanie użytkownika.
 */
export function CinematicVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPausedRef.current) {
          video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      video.play().catch(() => setPlaying(false));
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  return (
    <section className="cinema" aria-labelledby="cinema-title">
      <div className="cinema-frame">
        <video
          ref={videoRef}
          className="cinema-video"
          poster={POSTER}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src="/videos/cinematic-pillow-16x9.webm" type="video/webm" />
          <source src="/videos/cinematic-pillow-16x9.mp4" type="video/mp4" />
        </video>
        <div className="cinema-overlay" aria-hidden="true" />

        <div className="wrap cinema-copy">
          <h2 id="cinema-title" className="h2">
            Chwila, w której głowa odpoczywa.
          </h2>
          <p className="cinema-text">Krótki film z naturalnym światłem. Bez dźwięku.</p>
          <button type="button" className="video-toggle" onClick={toggle} aria-pressed={playing}>
            {playing ? 'Zatrzymaj ruch' : 'Odtwórz ruch'}
          </button>
        </div>
      </div>
    </section>
  );
}
