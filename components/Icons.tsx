type IconProps = { className?: string };

const base = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

/** Profil ergonomiczny: wgłębienie i uniesione boki. */
export function IconContour({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 27C10 19 16 18 21 22C23 23.6 25 23.6 27 22C32 18 38 19 42 27V33C38 39 32 40 27 36C25 34.6 23 34.6 21 36C16 40 10 39 6 33Z" />
    </svg>
  );
}

/** Pianka: komórki o ciągłej strukturze. */
export function IconFoam({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="7" y="9" width="34" height="30" rx="3" />
      <circle cx="16" cy="18" r="2.6" />
      <circle cx="28" cy="18" r="2.6" />
      <circle cx="22" cy="28" r="2.6" />
      <circle cx="33" cy="30" r="1.6" />
      <circle cx="13" cy="31" r="1.6" />
    </svg>
  );
}

/** Podparcie: łagodny łuk pod głową i szyją. */
export function IconSupport({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 31C13 19 35 19 40 31" />
      <path d="M14 38H34" />
      <path d="M24 24V14" />
    </svg>
  );
}

/** Pokrowiec: prostokąt z zamkiem. */
export function IconCover({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="10" width="30" height="28" rx="2.5" />
      <path d="M9 17H39" strokeDasharray="2 3" />
      <path d="M24 17V38" />
    </svg>
  );
}
