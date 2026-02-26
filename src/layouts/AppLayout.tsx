import { useEffect, useState, type PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 960);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="app-shell">
      {isMobile && mobileMenuOpen && (
        <button type="button" className="app-sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <Sidebar isMobile={isMobile} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="app-main">
        <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <strong>{user?.name}</strong>
            <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>{user?.role}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {isMobile && (
              <Button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                variant="secondary"
                aria-label="Abrir menu"
                title="Abrir menu"
              >
                <Icon name="menu" />
              </Button>
            )}
            <Button
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Sair
            </Button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
