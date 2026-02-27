import { NavLink } from 'react-router-dom';
import { BookOpen, FileSpreadsheet, GraduationCap, LayoutDashboard, MessageSquareQuote, MessagesSquare, Trophy, UserRoundCog, Users } from 'lucide-react';

import { useAuthStore } from '@/store/auth';
import { hasAccess } from '@/types/roles';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Cursos', key: 'courses', icon: BookOpen },
  { to: '/forum', label: 'Fórum', key: 'forum', icon: MessagesSquare },
  { to: '/ranking', label: 'Ranking', key: 'ranking', icon: Trophy },
  { to: '/imports', label: 'Alunos', key: 'imports', icon: GraduationCap },
  { to: '/teachers', label: 'Professores', key: 'teachers', icon: UserRoundCog },
  { to: '/psychologists', label: 'Psicólogos', key: 'psychologists', icon: Users },
  { to: '/psychologist-chat', label: 'Atendimentos', key: 'psychologist-chat', icon: MessageSquareQuote },
] as const;

type SidebarProps = {
  isMobile?: boolean;
  mobileOpen?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isMobile = false, mobileOpen = false, collapsed = false, onClose }: SidebarProps) {
  const role = useAuthStore((state) => state.user?.role);
  const visibleItems = items.filter((item) => hasAccess(role, item.key));

  return (
    <aside
      className={cn(
        'app-sidebar sticky top-0 h-screen border-r bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70',
        isMobile ? 'fixed left-0 z-50 transition-transform duration-200' : 'hidden md:block',
        collapsed ? 'w-20' : 'w-72',
        isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0',
      )}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileSpreadsheet size={18} />
            </span>
            {!collapsed ? (
              <div>
                <p className="text-sm font-semibold">RPX Cursos</p>
                <p className="text-xs text-muted-foreground">Painel Admin</p>
              </div>
            ) : null}
          </div>
          {isMobile ? (
            <button className="rounded-md border px-2 py-1 text-sm" type="button" onClick={onClose} aria-label="Fechar menu">
              ✕
            </button>
          ) : null}
        </div>

        <nav className="grid gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (isMobile) onClose?.();
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-primary/10 text-primary',
                    collapsed && 'justify-center',
                  )
                }
              >
                <Icon size={18} />
                {!collapsed ? item.label : null}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
