import type { CSSProperties } from 'react';

type IconName = 'menu' | 'edit' | 'trash' | 'plus' | 'open';

type IconProps = {
  name: IconName;
  size?: number;
  style?: CSSProperties;
};

export function Icon({ name, size = 16, style }: IconProps) {
  const base = {
    width: size,
    height: size,
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    flexShrink: 0,
    ...style,
  };

  if (name === 'menu') {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  if (name === 'edit') {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L8 18l-4 1 1-4z" />
      </svg>
    );
  }

  if (name === 'trash') {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v7h-7" />
      <path d="M3 10V3h7" />
      <path d="M3 21 14 10" />
    </svg>
  );
}
