import { useMemo, useState, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { AppShellLayout } from '@/components/shared/AppShellLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  courses: 'Cursos',
  quizzes: 'Quizzes',
  forum: 'Fórum',
  ranking: 'Ranking',
  imports: 'Alunos',
  teachers: 'Professores',
  psychologists: 'Psicólogos',
  'psychologist-chat': 'Atendimentos',
};

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const crumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((part) => labels[part] ?? part);
  }, [location.pathname]);

  return (
    <AppShellLayout
      sidebar={
        <>
          {mobileMenuOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar menu"
            />
          ) : null}
          <Sidebar isMobile mobileOpen={mobileMenuOpen} collapsed={false} onClose={() => setMobileMenuOpen(false)} />
          <Sidebar collapsed={collapsed} />
        </>
      }
      topbar={
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu">
                <Menu size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label="Colapsar menu"
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </Button>
              <div className="hidden text-xs text-muted-foreground md:block">
                {crumbs.length ? crumbs.join(' / ') : 'Início'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notificações">
                <Bell size={18} />
              </Button>
              <div className="hidden items-center gap-2 rounded-lg border px-2 py-1.5 md:flex">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback>{user?.name?.slice(0, 1)?.toUpperCase() ?? 'A'}</AvatarFallback>
                </Avatar>
                <div className={cn('leading-tight')}>
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                variant="outline"
                size="sm"
              >
                <LogOut size={16} />
                Sair
              </Button>
            </div>
          </div>
        </header>
      }
    >
      {children}
    </AppShellLayout>
  );
}
