import { NavLink } from 'react-router-dom';

import { useAuthStore } from '@/store/auth';
import { hasAccess } from '@/types/roles';

const items = [
  { to: '/dashboard', label: 'Dashboard', key: 'dashboard' },
  { to: '/courses', label: 'Cursos', key: 'courses' },
  { to: '/forum', label: 'Forum', key: 'forum' },
  { to: '/ranking', label: 'Ranking', key: 'ranking' },
  { to: '/imports', label: 'Alunos', key: 'imports' },
  { to: '/teachers', label: 'Professores', key: 'teachers' },
  { to: '/psychologists', label: 'Psicólogos', key: 'psychologists' },
  { to: '/psychologist-chat', label: 'Atendimentos', key: 'psychologist-chat' },
];

type SidebarProps = {
  isMobile?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isMobile = false, mobileOpen = false, onClose }: SidebarProps) {
  const role = useAuthStore((state) => state.user?.role);
  const visibleItems = items.filter((item) => hasAccess(role, item.key));

  return (
    <aside
      className={`app-sidebar ${isMobile ? 'is-mobile' : ''} ${mobileOpen ? 'is-open' : ''}`}
      style={{ width: 280, background: '#fff', borderRight: '1px solid #d9e5e8', padding: 18 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>RPX Cursos</h1>
        {isMobile && (
          <button className="sidebar-close-button" type="button" onClick={onClose} aria-label="Fechar menu">
            ✕
          </button>
        )}
      </div>
      <p style={{ color: 'var(--gray-1)' }}>Painel Admin</p>

      <nav style={{ display: 'grid', gap: 8, marginTop: 20 }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (isMobile) onClose?.();
            }}
            style={({ isActive }) => ({
              textDecoration: 'none',
              color: 'var(--text)',
              padding: '12px',
              borderRadius: 10,
              border: '1px solid var(--primary-soft)',
              background: isActive ? 'var(--primary-soft)' : '#fff',
              fontWeight: 700,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
