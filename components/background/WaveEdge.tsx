type WaveEdgeProps = {
  /** Kolor sekcji, w którą fala przechodzi (musi odpowiadać tłu następnej sekcji). */
  fill: string;
  className?: string;
};

/** Miękkie, falujące przejście między tłami sekcji. Umieszczane przy dolnej krawędzi sekcji. */
export function WaveEdge({ fill, className = '' }: WaveEdgeProps) {
  return (
    <svg
      className={`deco deco-wave ${className}`.trim()}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 64 C 240 20, 480 20, 720 60 S 1200 100, 1440 48 L 1440 120 L 0 120 Z" fill={fill} />
    </svg>
  );
}
