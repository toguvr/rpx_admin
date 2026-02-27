import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function KPIStatCard({
  title,
  value,
  description,
  icon,
  tag,
}: {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  tag?: string;
}) {
  return (
    <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-xs uppercase tracking-wide">{title}</CardDescription>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardTitle className="text-3xl font-bold tracking-tight">{value}</CardTitle>
        <div className="flex items-center justify-between gap-2">
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : <span />}
          {tag ? <Badge variant="secondary">{tag}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}
