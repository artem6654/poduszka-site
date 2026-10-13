import { WaveEdge } from './background/WaveEdge';
import { Reveal } from './Reveal';

export function EverydayComfort() {
  return (
    <section className="section comfort has-deco" aria-labelledby="comfort-title">
      <div className="wrap">
        <Reveal className="comfort-head">
          <p className="eyebrow">Na co dzień</p>
          <h2 id="comfort-title" className="h2">
            Kształt dla snu na boku i na plecach.
          </h2>
          <p className="lead">
            Pianka dopasowuje się do konturu głowy i szyi. Poniżej zobaczysz poduszkę w dwóch popularnych pozycjach
            snu, w realistycznej skali.
          </p>
        </Reveal>

        <div className="comfort-grid">
          <Reveal className="position-card">
            <figure>
              <img
                src="/images/sleep-side-position.webp"
                width={1024}
                height={1024}
                loading="lazy"
                alt="Osoba śpiąca na boku, z głową na poduszce XL w jasnej sypialni."
              />
              <figcaption>Sen na boku</figcaption>
            </figure>
          </Reveal>
          <Reveal delay={120} className="position-card">
            <figure>
              <img
                src="/images/sleep-back-position.webp"
                width={1024}
                height={1024}
                loading="lazy"
                alt="Osoba leżąca na plecach, z głową na poduszce XL, w jasnej sypialni."
              />
              <figcaption>Sen na plecach</figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <p className="disclaimer">
            Produkt nie leczy ani nie zapobiega dolegliwościom bólowym, chrapaniu ani schorzeniom kręgosłupa. Nie
            zastępuje konsultacji ze specjalistą.
          </p>
        </Reveal>
      </div>
      <WaveEdge fill="#FBF8F2" />
    </section>
  );
}
