import { product } from '@/config/store';
import { DimensionDiagram } from './DimensionDiagram';
import { ParallaxMedia } from './ParallaxMedia';
import { Reveal } from './Reveal';

export function Features() {
  return (
    <section id="szczegoly" className="section features has-deco" aria-labelledby="features-title">
      <span className="glow glow--features" aria-hidden="true" />
      <div className="wrap">
        <Reveal>
          <header className="section-head">
            <p className="eyebrow">Szczegóły</p>
            <h2 id="features-title" className="h2">
              Kształt, materiał i wymiary.
            </h2>
          </header>
        </Reveal>

        <div className="feature">
          <Reveal className="feature-media">
            <ParallaxMedia speed={0.05}>
              <img
                src="/images/detail-contour-fabric.webp"
                width={1024}
                height={1024}
                loading="lazy"
                alt="Zbliżenie na miękką szarą tkaninę pokrowca i wyprofilowany kontur poduszki."
              />
            </ParallaxMedia>
          </Reveal>
          <Reveal delay={120} className="feature-copy">
            <h3 className="h3">Kształt, który prowadzi głowę.</h3>
            <p className="body">
              Wgłębienie na środku i uniesione boki tworzą ergonomiczny profil. Głowa i szyja mają w czym spocząć,
              a pianka dopasowuje się do ich konturu.
            </p>
          </Reveal>
        </div>

        <div className="feature feature--reverse feature--material">
          <Reveal className="feature-copy">
            <h3 className="h3">Pianka, która dopasowuje się do nacisku.</h3>
            <p className="body">
              Pianka PU Memory Foam powoli reaguje na ciężar głowy i wraca do pierwotnego kształtu po zmianie pozycji.
            </p>
            <dl className="stat-row">
              <div>
                <dt>Gęstość</dt>
                <dd>ok. {product.densityKgM3} kg/m³</dd>
              </div>
              <div>
                <dt>Waga</dt>
                <dd>{product.weightKg.toFixed(2).replace('.', ',')} kg</dd>
              </div>
              <div>
                <dt>Wypełnienie</dt>
                <dd>Memory Foam</dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={120} className="feature-figure-wrap">
            <p className="feature-figure" aria-hidden="true">
              45
            </p>
            <p className="feature-figure-label">kilogramów na metr sześcienny: gęstość pianki, wartość przybliżona</p>
          </Reveal>
        </div>

        <div className="feature feature--dimensions">
          <Reveal className="dimension-panel">
            <DimensionDiagram />
          </Reveal>
          <Reveal delay={120} className="feature-copy">
            <h3 className="h3">Wymiary, które dają przestrzeń.</h3>
            <p className="body">
              Długość {product.dimensionsCm.length} cm i szerokość {product.dimensionsCm.width} cm pozwalają zmieniać pozycję bez ciasnoty. Wymiary podajemy według opisu
              produktu jako przybliżone.
            </p>
          </Reveal>
        </div>

        <div className="feature feature--reverse">
          <Reveal className="feature-media">
            <ParallaxMedia speed={0.05}>
              <img
                src="/images/product-ivory-studio.webp"
                width={1024}
                height={1024}
                loading="lazy"
                alt="Poduszka XL na jasnym kremowym tle, widok z lekko podniesionej perspektywy."
              />
            </ParallaxMedia>
          </Reveal>
          <Reveal delay={120} className="feature-copy">
            <h3 className="h3">Zdejmowany pokrowiec.</h3>
            <p className="body">
              Poszewka z poliestru w kolorze biało-szarym zdejmuje się, dzięki czemu łatwo utrzymać ją w czystości.
            </p>
            <ul className="check-list">
              <li>Pokrowiec z poliestru, zdejmowany</li>
              <li>Rdzeń z pianki nie nadaje się do prania i nie może być wystawiony na bezpośrednie słońce</li>
            </ul>
          </Reveal>
        </div>

        <Reveal className="bedroom-band">
          <figure className="bedroom-figure">
            <img
              src="/images/editorial-bedroom-wide.webp"
              width={1024}
              height={1024}
              loading="lazy"
              alt="Spokojna, minimalistyczna sypialnia z ciepłymi ścianami i pościelą z lnu, z poduszką XL na łóżku."
            />
          </figure>
          <div className="bedroom-copy">
            <h3 className="h3">Spokojna sypialnia.</h3>
            <p className="body">
              Biało-szara kolorystyka pasuje do neutralnych wnętrz: do lnu, drewna i ciepłych ścian. Poduszka wygląda
              spokojnie zarówno w sypialni, jak i w pokoju gościnnym.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
