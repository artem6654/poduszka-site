import { product } from '@/config/store';

/**
 * Rysunek techniczny w skali: widok z góry (długość × szerokość) i z boku (wysokość).
 * Skala: 1 cm = 6,9 px. Wymiary pochodzą z `config/store.ts`, a nie z obrazu AI.
 */
const PX_PER_CM = 6.9;

export function DimensionDiagram() {
  const { length, width, height } = product.dimensionsCm;
  const L = length * PX_PER_CM;
  const W = width * PX_PER_CM;
  const H = height * PX_PER_CM;

  // Kontur widoku z góry: wgłębienie na środku i uniesione boki (skala 1:1 z wymiarów 63 × 41 cm).
  const topOutline = [
    `M 0 ${0.22 * W}`,
    `C ${0.064 * L} ${0.11 * W}, ${0.16 * L} ${0.05 * W}, ${0.257 * L} ${0.073 * W}`,
    `C ${0.343 * L} ${0.095 * W}, ${0.41 * L} ${0.25 * W}, ${0.5 * L} ${0.25 * W}`,
    `C ${0.59 * L} ${0.25 * W}, ${0.657 * L} ${0.095 * W}, ${0.743 * L} ${0.073 * W}`,
    `C ${0.84 * L} ${0.05 * W}, ${0.936 * L} ${0.11 * W}, ${L} ${0.22 * W}`,
    `L ${L} ${0.78 * W}`,
    `C ${0.936 * L} ${0.89 * W}, ${0.84 * L} ${0.95 * W}, ${0.743 * L} ${0.927 * W}`,
    `C ${0.657 * L} ${0.905 * W}, ${0.59 * L} ${0.75 * W}, ${0.5 * L} ${0.75 * W}`,
    `C ${0.41 * L} ${0.75 * W}, ${0.343 * L} ${0.905 * W}, ${0.257 * L} ${0.927 * W}`,
    `C ${0.16 * L} ${0.95 * W}, ${0.064 * L} ${0.89 * W}, 0 ${0.78 * W}`,
    'Z',
  ].join(' ');

  const pad = 44;
  const topViewBox = `0 0 ${L + pad * 2} ${W + pad * 2}`;
  const sideViewBox = `0 0 ${L + pad * 2} ${H + pad * 2}`;

  return (
    <figure className="dimension-diagram">
      <svg
        className="dimension-svg"
        viewBox={topViewBox}
        role="img"
        aria-label={`Widok z góry: długość ${length} cm, szerokość ${width} cm.`}
      >
        <g transform={`translate(${pad} ${pad})`}>
          <path className="dim-shape" d={topOutline} />
          <path className="dim-guide" d={`M ${L * 0.5} ${0.22 * W} L ${L * 0.5} ${0.78 * W}`} />
          <line className="dim-line" x1={0} y1={W + 22} x2={L} y2={W + 22} />
          <line className="dim-tick" x1={0} y1={W + 14} x2={0} y2={W + 30} />
          <line className="dim-tick" x1={L} y1={W + 14} x2={L} y2={W + 30} />
          <line className="dim-line" x1={L + 22} y1={0} x2={L + 22} y2={W} />
          <line className="dim-tick" x1={L + 14} y1={0} x2={L + 30} y2={0} />
          <line className="dim-tick" x1={L + 14} y1={W} x2={L + 30} y2={W} />
        </g>
      </svg>

      <svg
        className="dimension-svg dimension-svg--side"
        viewBox={sideViewBox}
        role="img"
        aria-label={`Widok z boku: wysokość ${height} cm.`}
      >
        <g transform={`translate(${pad} ${pad})`}>
          <path className="dim-shape" d={`M 0 ${H} L 0 ${H * 0.35} Q 0 0 ${H * 0.9} 0 L ${L - H * 0.9} 0 Q ${L} 0 ${L} ${H * 0.35} L ${L} ${H} Z`} />
          <line className="dim-line" x1={0} y1={H + 18} x2={L} y2={H + 18} />
          <line className="dim-line" x1={-18} y1={0} x2={-18} y2={H} />
        </g>
      </svg>

      <figcaption className="dimension-values">
        <dl>
          <div>
            <dt>Długość</dt>
            <dd>{length} cm</dd>
          </div>
          <div>
            <dt>Szerokość</dt>
            <dd>{width} cm</dd>
          </div>
          <div>
            <dt>Wysokość</dt>
            <dd>{height} cm</dd>
          </div>
        </dl>
        <p className="dimension-note">Wymiary są przybliżone, według opisu produktu.</p>
      </figcaption>
    </figure>
  );
}
