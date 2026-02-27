import type { ReactNode } from 'react';

import { Table } from '@/components/ui/table';

export function DataTable({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-4">
      {toolbar ? <div className="flex flex-wrap items-center justify-between gap-2">{toolbar}</div> : null}
      <Table>{children}</Table>
    </div>
  );
}
