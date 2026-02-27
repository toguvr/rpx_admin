import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={['min-w-0 max-w-full overflow-hidden', className].filter(Boolean).join(' ')}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action ? <div className="min-w-0 sm:ml-auto">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
