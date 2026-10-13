import { product } from '@/config/store';
import { IconContour, IconCover, IconFoam, IconSupport } from './Icons';
import { Reveal } from './Reveal';

const { length, width } = product.dimensionsCm;

const benefits = [
  {
    Icon: IconContour,
    title: 'Ergonomiczny kształt XL',
    text: `Profil z wgłębieniem i uniesionymi bokami, ${length} × ${width} cm.`,
  },
  {
    Icon: IconFoam,
    title: 'Pianka Memory Foam',
    text: `Gęstość ok. ${product.densityKgM3} kg/m³. Dopasowuje się do głowy i szyi.`,
  },
  {
    Icon: IconSupport,
    title: 'Profil pod głowę i szyję',
    text: 'Wgłębienie na głowę oraz uniesione boki pod szyję.',
  },
  {
    Icon: IconCover,
    title: 'Zdejmowany pokrowiec',
    text: 'Poszewka z poliestru zdejmuje się do czyszczenia. Rdzeń z pianki zostaje w środku.',
  },
];

export function BenefitStrip() {
  return (
    <section id="korzysci" className="benefits" aria-label="Najważniejsze cechy">
      <div className="wrap benefits-grid">
        {benefits.map(({ Icon, title, text }, index) => (
          <Reveal key={title} delay={index * 90} className="benefit">
            <span className="benefit-icon">
              <Icon />
            </span>
            <h3 className="benefit-title">{title}</h3>
            <p className="benefit-text">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
