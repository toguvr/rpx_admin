import type { PropsWithChildren, ReactNode } from 'react';

export function AppShellLayout({ sidebar, topbar, children }: PropsWithChildren<{ sidebar: ReactNode; topbar: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          {topbar}
          <main className="container py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
