import type { CSSProperties, PropsWithChildren } from 'react';

export function Card({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) {
  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 10,
        padding: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
