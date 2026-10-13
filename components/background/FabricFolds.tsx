type FabricFoldsProps = {
  className?: string;
  /** Liczba linii fałdów. */
  count?: number;
};

/**
 * Równoległe, lekko falujące linie przypominające miękką tkaninę.
 * Skalują się bez zniekształcania grubości linii (vector-effect), a kolor jest bardzo nisko kontrastowy.
 */
export function FabricFolds({ className = '', count = 6 }: FabricFoldsProps) {
  const paths = Array.from({ length: count }, (_, index) => {
    const y = 40 + index * (320 / Math.max(count - 1, 1));
    const lift = index % 2 === 0 ? 36 : -30;
    return `M -60 ${y} C 220 ${y - lift}, 420 ${y + lift}, 640 ${y} S 1080 ${y - lift}, 1260 ${y}`;
  });

  return (
    <svg
      className={`deco deco-folds ${className}`.trim()}
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
