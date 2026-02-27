import type { ButtonHTMLAttributes, MouseEvent, PropsWithChildren } from 'react';
import { useState } from 'react';

import { Button as UIButton } from '@/components/ui/button';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type Size = 'default' | 'sm' | 'lg' | 'icon';

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    variant?: Variant;
    size?: Size;
  }
>;

export function Button({
  children,
  loading: externalLoading = false,
  variant = 'default',
  size = 'default',
  className,
  ...rest
}: Props) {
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
    <UIButton
      {...rest}
      onClick={handleClick}
      className={className}
      variant={variant}
      size={size}
      disabled={rest.disabled || isLoading}
      type={rest.type ?? 'button'}
    >
      {isLoading ? 'Carregando...' : children}
    </UIButton>
  );
}
