import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/States';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/services/api';

type StudentReport = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  group?: { id: string; name: string; isActive: boolean } | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  coursesCompleted: number;
  totalCourses: number;
  averageFinalQuizScore: number | null;
  feedbackAnsweredAt: string | null;
  certificateReady: boolean;
};

export function StudentReportsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<'all' | string>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-reports'],
    queryFn: async () => (await api.get<StudentReport[]>('/users/students/reports')).data,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((student) => {
      const matchesSearch =
        !term ||
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.group?.name ?? '').toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && student.isActive) ||
        (statusFilter === 'inactive' && !student.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const printableStudents = useMemo(() => {
    if (selectedStudentId === 'all') return filtered;
    return filtered.filter((student) => student.id === selectedStudentId);
  }, [filtered, selectedStudentId]);

  return (
    <div className="grid gap-6 student-reports-page">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }

          body * { visibility: hidden; }
          .student-report-print, .student-report-print * { visibility: visible; }
          .student-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px !important;
          }

          .student-report-print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
            border-radius: 8px !important;
            padding: 10px !important;
            margin: 0 !important;
            border-color: #d4d4d8 !important;
          }

          .student-report-print-header {
            margin-bottom: 8px !important;
            gap: 8px !important;
          }

          .student-report-print-name {
            font-size: 13px !important;
            line-height: 1.2 !important;
          }

          .student-report-print-meta {
            font-size: 10px !important;
            line-height: 1.25 !important;
          }

          .student-report-print-status {
            font-size: 10px !important;
            line-height: 1.25 !important;
          }

          .student-report-metrics {
            gap: 6px !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .student-report-metric-card {
            padding: 8px !important;
            border-radius: 6px !important;
          }

          .student-report-metric-title {
            font-size: 9px !important;
            line-height: 1.2 !important;
            margin-bottom: 2px !important;
          }

          .student-report-metric-value {
            font-size: 16px !important;
            line-height: 1.1 !important;
          }

          .student-report-metric-sub {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }

          .student-report-feedback-value {
            font-size: 13px !important;
            line-height: 1.1 !important;
          }
        }

        @media print and (max-width: 900px) {
          .student-report-print {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <PageHeader
        title="Relatórios"
        description="Relatórios imprimíveis com dados consolidados dos alunos."
        actions={<Button onClick={() => window.print()} disabled={!printableStudents.length}>Imprimir</Button>}
      />

      <SectionCard title="Filtros" description="Defina quais alunos entram no relatório impresso.">
        <div className="grid gap-3 md:grid-cols-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou lote" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </Select>
          <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
            <option value="all">Todos os alunos filtrados</option>
            {filtered.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </Select>
        </div>
      </SectionCard>

      <SectionCard title="Prévia do Relatório" description="O conteúdo abaixo será usado na impressão.">
        {isLoading ? <LoadingState rows={4} /> : null}
        {isError ? <ErrorState message="Erro ao carregar relatórios dos alunos." onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && !printableStudents.length ? (
          <EmptyState title="Sem alunos no relatório" description="Ajuste os filtros para incluir alunos na impressão." />
        ) : null}

        {!!printableStudents.length && (
          <div className="student-report-print grid gap-4">
            {printableStudents.map((student) => (
              <div key={student.id} className="student-report-print-card rounded-xl border bg-card p-5 shadow-sm">
                <div className="student-report-print-header mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="student-report-print-name text-xl font-semibold">{student.name}</h2>
                    <p className="student-report-print-meta text-sm text-muted-foreground">{student.email}</p>
                    <p className="student-report-print-meta text-sm text-muted-foreground">
                      Lote: {student.group?.name ?? 'Sem lote'} • Cadastro:{' '}
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div className="student-report-print-status text-right text-sm">
                    <p>Status: {student.isActive ? 'Ativo' : 'Inativo'}</p>
                    <p>Certificado: {student.certificateReady ? 'Liberado' : 'Pendente'}</p>
                    <p>
                      Feedback:{' '}
                      {student.feedbackAnsweredAt ? new Date(student.feedbackAnsweredAt).toLocaleDateString('pt-BR') : 'Não respondido'}
                    </p>
                  </div>
                </div>

                <div className="student-report-metrics grid gap-3 md:grid-cols-4">
                  <div className="student-report-metric-card rounded-lg border p-3">
                    <p className="student-report-metric-title text-xs uppercase text-muted-foreground">Progresso</p>
                    <p className="student-report-metric-value text-2xl font-semibold">{student.progressPercent}%</p>
                    <p className="student-report-metric-sub text-sm text-muted-foreground">
                      {student.completedLessons}/{student.totalLessons} aulas
                    </p>
                  </div>
                  <div className="student-report-metric-card rounded-lg border p-3">
                    <p className="student-report-metric-title text-xs uppercase text-muted-foreground">Cursos</p>
                    <p className="student-report-metric-value text-2xl font-semibold">{student.coursesCompleted}/{student.totalCourses}</p>
                    <p className="student-report-metric-sub text-sm text-muted-foreground">Concluídos</p>
                  </div>
                  <div className="student-report-metric-card rounded-lg border p-3">
                    <p className="student-report-metric-title text-xs uppercase text-muted-foreground">Quiz final</p>
                    <p className="student-report-metric-value text-2xl font-semibold">
                      {student.averageFinalQuizScore !== null ? `${student.averageFinalQuizScore}%` : '-'}
                    </p>
                    <p className="student-report-metric-sub text-sm text-muted-foreground">Média final</p>
                  </div>
                  <div className="student-report-metric-card rounded-lg border p-3">
                    <p className="student-report-metric-title text-xs uppercase text-muted-foreground">Feedback</p>
                    <p className="student-report-feedback-value text-lg font-semibold">{student.feedbackAnsweredAt ? 'Respondido' : 'Pendente'}</p>
                    <p className="student-report-metric-sub text-sm text-muted-foreground">
                      {student.feedbackAnsweredAt ? new Date(student.feedbackAnsweredAt).toLocaleString('pt-BR') : 'Sem resposta'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
