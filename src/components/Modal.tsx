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
        background: 'rgba(6, 7, 8, 0.45)',
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
          background: '#fff',
          borderRadius: 16,
          border: '1px solid var(--primary-soft)',
          padding: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <Button style={{ background: 'var(--gray-1)' }} onClick={onClose}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
