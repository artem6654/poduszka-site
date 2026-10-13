import { product } from '@/config/store';
import { WaveEdge } from './background/WaveEdge';
import { Reveal } from './Reveal';

const { length, width, height } = product.dimensionsCm;

const rows: { label: string; value: string }[] = [
  { label: 'Wymiary (dł. × szer. × wys.)', value: `${length} × ${width} × ${height} cm (dane przybliżone)` },
  { label: 'Waga', value: `${product.weightKg.toString().replace('.', ',')} kg` },
  { label: 'Wypełnienie', value: `${product.filling}` },
  { label: 'Pokrowiec', value: `${product.cover}${product.coverRemovable ? ', zdejmowany' : ''}` },
  { label: 'Kolor', value: product.colour },
  { label: 'Właściwości', value: product.antiallergic ? 'Antyalergiczne wypełnienie (wg opisu produktu)' : 'Brak danych' },
  { label: 'Pielęgnacja pokrowca', value: product.careCover },
  { label: 'Pielęgnacja rdzenia', value: product.careCore },
];

export function Specifications() {
  return (
    <section id="specyfikacja" className="section specs has-deco" aria-labelledby="specs-title">
      <div className="wrap specs-grid">
        <Reveal className="specs-head">
          <p className="eyebrow">Dane techniczne</p>
          <h2 id="specs-title" className="h2">
            Wymiary i specyfikacja.
          </h2>
          <p className="body">
            Dane pochodzą z opisu produktu. Wymiary są przybliżone. Przed publikacją sprawdź je na fizycznym
            egzemplarzu.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <dl className="spec-list">
            {rows.map((row) => (
              <div key={row.label} className="spec-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
      <WaveEdge fill="#F5F0E7" />
    </section>
  );
}
