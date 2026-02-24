import type { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <strong>{user?.name}</strong>
            <p style={{ margin: 0, color: 'var(--gray-1)' }}>{user?.role}</p>
          </div>
          <Button
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Sair
          </Button>
        </header>
        {children}
      </main>
    </div>
  );
}
