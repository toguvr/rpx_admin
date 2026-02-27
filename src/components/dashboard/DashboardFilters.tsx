import { CalendarRange, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { DatePreset } from '@/services/metrics';

const PRESETS: Array<{ label: string; value: DatePreset }> = [
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
];

export function DashboardFilters({
  from,
  to,
  courseId,
  groupId,
  courses,
  groups,
  preset,
  onPresetChange,
  onFromChange,
  onToChange,
  onCourseChange,
  onGroupChange,
  onReset,
}: {
  from: string;
  to: string;
  courseId: string;
  groupId: string;
  courses: Array<{ id: string; title: string }>;
  groups: Array<{ id: string; name: string }>;
  preset: DatePreset;
  onPresetChange: (value: DatePreset) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card/95 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="dashboard-period">Período rápido</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((item) => (
                <Button
                  key={item.value}
                  id={item.value === preset ? 'dashboard-period' : undefined}
                  variant={item.value === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPresetChange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard-from">De</Label>
            <Input id="dashboard-from" type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard-to">Até</Label>
            <Input id="dashboard-to" type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard-course">Curso</Label>
            <Select id="dashboard-course" value={courseId} onChange={(event) => onCourseChange(event.target.value)}>
              <option value="">Todos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard-group">Turma</Label>
            <Select id="dashboard-group" value={groupId} onChange={(event) => onGroupChange(event.target.value)}>
              <option value="">Todas</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReset}>
            <RefreshCcw size={16} />
            Limpar
          </Button>
          <Button variant="secondary" disabled>
            <CalendarRange size={16} />
            Filtros ativos
          </Button>
        </div>
      </div>
    </div>
  );
}
