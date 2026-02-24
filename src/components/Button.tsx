import type { ButtonHTMLAttributes, MouseEvent, PropsWithChildren } from 'react';
import { useState } from 'react';

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }>;

export function Button({ children, style, loading: externalLoading = false, ...rest }: Props) {
  const [loading, setLoading] = useState(false);
  const isLoading = loading || externalLoading;

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!rest.onClick || isLoading || rest.disabled) return;
    const result = rest.onClick(event) as unknown;

    if (result && typeof (result as { then?: unknown }).then === 'function') {
      try {
        setLoading(true);
        await (result as Promise<unknown>);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <button
      {...rest}
      onClick={handleClick}
      disabled={rest.disabled || isLoading}
      style={{
        background: 'var(--primary)',
        color: 'var(--on-primary)',
        border: 'none',
        borderRadius: 12,
        padding: '10px 16px',
        fontWeight: 700,
        cursor: 'pointer',
        opacity: rest.disabled || isLoading ? 0.7 : 1,
        ...style,
      }}
    >
      {isLoading ? 'Carregando...' : children}
    </button>
  );
}
