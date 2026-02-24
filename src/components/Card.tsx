import type { CSSProperties, PropsWithChildren } from 'react';

export function Card({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 16,
        border: '1px solid var(--primary-soft)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
