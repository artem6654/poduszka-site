type CrescentProps = {
  /** Unikalny identyfikator maski w obrębie strony. */
  id: string;
  className?: string;
};

/** Delikatny półksiężyc z maski. Kolor ustawia się przez `color` w CSS. */
export function Crescent({ id, className = '' }: CrescentProps) {
  return (
    <svg className={`deco deco-moon ${className}`.trim()} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <mask id={`${id}-mask`}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="68" cy="36" r="33" fill="#000" />
        </mask>
      </defs>
      <circle cx="46" cy="54" r="42" fill="currentColor" mask={`url(#${id}-mask)`} />
    </svg>
  );
}

type SparkleItem = { x: number; y: number; size: number };

const sparklePath = 'M0 -6 Q0.8 -0.8 6 0 Q0.8 0.8 0 6 Q-0.8 0.8 -6 0 Q-0.8 -0.8 0 -6 Z';

/** Kilka drobnych gwiazdek o określonych pozycjach (w procentach obszaru rodzica). */
export function Sparkles({ items, className = '' }: { items: SparkleItem[]; className?: string }) {
  return (
    <>
      {items.map((item, index) => (
        <span
          key={index}
          className={`deco spark ${className}`.trim()}
          style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size }}
          aria-hidden="true"
        >
          <svg viewBox="-6 -6 12 12" focusable="false">
            <path d={sparklePath} fill="currentColor" />
          </svg>
        </span>
      ))}
    </>
  );
}
