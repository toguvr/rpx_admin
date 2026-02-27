import type { CSSProperties, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function Card({ children, style, className }: PropsWithChildren<{ style?: CSSProperties; className?: string }>) {
  return (
    <div
      className={cn('rounded-xl border bg-card p-5 text-card-foreground shadow-sm', className)}
      style={style}
    >
      {children}
    </div>
  );
}
