// The Pharos mark: a Greek lighthouse with red bands and an amber beam,
// on deep navy. Same drawing as public/icon.svg (the app icon).
export function Logo(props: { size?: number; animate?: boolean; title?: string }) {
  const s = props.size ?? 40;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      class={props.animate ? 'logo-mark animate' : 'logo-mark'}
      role={props.title ? 'img' : undefined}
      aria-label={props.title}
      aria-hidden={props.title ? undefined : 'true'}
    >
      <rect width="64" height="64" rx="15" fill="#0E1B2B" />
      <defs>
        <linearGradient id="pharos-bl" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#FFC94D" stop-opacity="0.95" />
          <stop offset="1" stop-color="#FFC94D" stop-opacity="0.08" />
        </linearGradient>
        <linearGradient id="pharos-br" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#FFC94D" stop-opacity="0.95" />
          <stop offset="1" stop-color="#FFC94D" stop-opacity="0.08" />
        </linearGradient>
        <clipPath id="pharos-tower">
          <polygon points="26.5,27 37.5,27 41,54 23,54" />
        </clipPath>
      </defs>
      <g class="beams">
        <polygon points="32,18 3,8 3,28" fill="url(#pharos-bl)" />
        <polygon points="32,18 61,8 61,28" fill="url(#pharos-br)" />
      </g>
      <polygon points="26.5,27 37.5,27 41,54 23,54" fill="#FFFFFF" />
      <g clip-path="url(#pharos-tower)" fill="#D62839">
        <rect x="20" y="31" width="24" height="6" />
        <rect x="20" y="43" width="24" height="6" />
      </g>
      <rect x="24" y="24" width="16" height="3" rx="1" fill="#FFFFFF" />
      <rect x="27.5" y="15" width="9" height="9" rx="1.5" fill="#FFB020" />
      <polygon points="26,15.5 32,9 38,15.5" fill="#D62839" />
      <rect x="18" y="54" width="28" height="4" rx="2" fill="#FFFFFF" />
    </svg>
  );
}
