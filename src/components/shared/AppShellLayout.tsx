import type { PropsWithChildren, ReactNode } from 'react';

export function AppShellLayout({ sidebar, topbar, children }: PropsWithChildren<{ sidebar: ReactNode; topbar: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen overflow-x-hidden">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          {topbar}
          <main className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 md:py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
