import type { ButtonHTMLAttributes, MouseEvent, PropsWithChildren } from 'react';
import { useState } from 'react';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type Size = 'default' | 'sm' | 'lg';

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    variant?: Variant;
    size?: Size;
  }
>;

const variantStyles: Record<Variant, string> = {
  default: 'var(--button-default)',
  secondary: 'var(--button-secondary)',
  destructive: 'var(--button-destructive)',
  outline: 'transparent',
  ghost: 'transparent',
};

const variantTextColors: Record<Variant, string> = {
  default: '#fff',
  secondary: '#fff',
  destructive: '#fff',
  outline: 'var(--foreground)',
  ghost: 'var(--foreground)',
};

const variantBorders: Record<Variant, string> = {
  default: '1px solid var(--button-default)',
  secondary: '1px solid var(--button-secondary)',
  destructive: '1px solid var(--button-destructive)',
  outline: '1px solid var(--border)',
  ghost: '1px solid transparent',
};

const sizeStyles: Record<Size, { minHeight: number; padding: string; fontSize: number }> = {
  default: { minHeight: 40, padding: '0 16px', fontSize: 14 },
  sm: { minHeight: 34, padding: '0 12px', fontSize: 13 },
  lg: { minHeight: 44, padding: '0 18px', fontSize: 15 },
};

export function Button({
  children,
  style,
  loading: externalLoading = false,
  variant = 'default',
  size = 'default',
  ...rest
}: Props) {
  const [loading, setLoading] = useState(false);
  const isLoading = loading || externalLoading;
  const sizeConfig = sizeStyles[size];

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
      type={rest.type ?? 'button'}
      style={{
        background: variantStyles[variant],
        color: variantTextColors[variant],
        border: variantBorders[variant],
        borderRadius: 8,
        minHeight: sizeConfig.minHeight,
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        fontWeight: 600,
        cursor: 'pointer',
        opacity: rest.disabled || isLoading ? 0.7 : 1,
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {isLoading ? 'Carregando...' : children}
    </button>
  );
}
