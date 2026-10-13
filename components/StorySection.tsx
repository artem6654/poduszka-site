import { Crescent, Sparkles } from './background/Crescent';
import { FabricFolds } from './background/FabricFolds';
import { ParallaxMedia } from './ParallaxMedia';
import { Reveal } from './Reveal';

export function StorySection() {
  return (
    <section className="section story has-deco grain" aria-labelledby="story-title">
      <FabricFolds className="story-folds drift-slow" count={7} />
      <Crescent id="story-moon" className="story-moon" />
      <Sparkles
        className="story-spark"
        items={[
          { x: 8, y: 9, size: 9 },
          { x: 14, y: 17, size: 6 },
          { x: 64, y: 7, size: 7 },
        ]}
      />
      <div className="wrap story-grid">
        <Reveal className="story-media-wrap">
          <ParallaxMedia speed={0.06} className="story-media">
            <img
              src="/images/lifestyle-resting-person.webp"
              width={1024}
              height={1024}
              loading="lazy"
              alt="Osoba odpoczywa na łóżku z poduszką XL, w ciepłym porannym świetle."
            />
          </ParallaxMedia>
        </Reveal>

        <div className="story-copy">
          <Reveal>
            <p className="eyebrow">Wieczorny rytuał</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="story-title" className="h2">
              Komfort, od którego zaczyna się dobry odpoczynek.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="body">
              Dzień bywa długi. Zanim zgasisz światło, daj sobie kilka spokojnych minut: odłóż telefon, zaciągnij
              zasłony, pozwól sobie na chwilę bez planów.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <p className="body">
              Dobra poduszka nie zmieni wszystkiego. Może jednak sprawić, że wieczorny rytuał zyska stały punkt:
              miejsce, w którym głowa naprawdę może odpocząć, o tej samej porze i w tym samym łóżku.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <a href="#szczegoly" className="link-line">
              Zobacz szczegóły produktu
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
