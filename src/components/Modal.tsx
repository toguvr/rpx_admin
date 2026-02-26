import type { PropsWithChildren } from 'react';

import { Button } from './Button';

type Props = PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
  width?: number;
}>;

export function Modal({ title, open, onClose, width = 560, children }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 8, 23, 0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: 'calc(100vh - 32px)',
          background: 'var(--card)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          padding: 16,
          display: 'grid',
          gap: 12,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
