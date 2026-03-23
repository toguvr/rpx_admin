export type Role = 'ADMIN' | 'PROFESSOR' | 'PSICOLOGO' | 'ALUNO';

export const roleAccessMap: Record<Role, string[]> = {
  ADMIN: [
    'dashboard',
    'courses',
    'reports',
    'feedback',
    'forum',
    'ranking',
    'imports',
    'teachers',
    'psychologists',
    'psychologist-chat',
  ],
  PROFESSOR: ['dashboard', 'forum', 'ranking'],
  PSICOLOGO: ['psychologist-chat'],
  ALUNO: [],
};

export function hasAccess(role: string | undefined, routeKey: string): boolean {
  if (!role) return false;
  const allowed = roleAccessMap[role as Role];
  return Boolean(allowed?.includes(routeKey));
}
