import type { ReactNode } from 'react';

import { EmptyState } from '@/components/shared/States';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DataBlockTable({
  headers,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[520px] sm:min-w-[640px]">
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
