import type { ReactNode } from 'react';

import { SectionCard } from '@/components/shared/SectionCard';

export function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} description={description} action={action} className="h-full border-border/70 bg-card/95">
      <div className="h-[300px] w-full">{children}</div>
    </SectionCard>
  );
}
