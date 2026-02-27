import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronDown,
  ClipboardCheck,
  Gauge,
  RefreshCcw,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartCard } from '@/components/dashboard/ChartCard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { DataBlockTable } from '@/components/dashboard/DataBlockTable';
import { KPIStatCard } from '@/components/dashboard/KPIStatCard';
import { LoadingSkeletonDashboard } from '@/components/dashboard/LoadingSkeletonDashboard';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/States';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/services/api';
import {
  type DatePreset,
  getMetricsFilters,
  getMetricsOverview,
  getMetricsRiskStudents,
  getMetricsTimeseries,
  getMetricsTopCourses,
  type TimeseriesMetric,
  type TopCoursesBy,
} from '@/services/metrics';
import { useAuthStore } from '@/store/auth';

const PIE_COLORS = ['#0f766e', '#0891b2', '#f59e0b'];

function presetRange(preset: DatePreset) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  const start = startDate.toISOString().slice(0, 10);
  return { from: start, to: end };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);

  const [preset, setPreset] = useState<DatePreset>('30d');
  const [from, setFrom] = useState(() => presetRange('30d').from);
  const [to, setTo] = useState(() => presetRange('30d').to);
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [timeseriesMetric, setTimeseriesMetric] = useState<TimeseriesMetric>('quizzes');
  const [groupBy, setGroupBy] = useState<'day' | 'week'>('day');
  const [topBy, setTopBy] = useState<TopCoursesBy>('efficiency');

  const filters = useMemo(
    () => ({
      from,
      to,
      ...(courseId ? { courseId } : {}),
      ...(groupId ? { groupId } : {}),
    }),
    [from, to, courseId, groupId],
  );

  const filtersQuery = useQuery({
    queryKey: ['dashboard-metrics-filters'],
    queryFn: getMetricsFilters,
  });

  const overviewQuery = useQuery({
    queryKey: ['dashboard-metrics-overview', filters],
    queryFn: () => getMetricsOverview(filters),
  });

  const timeseriesQuery = useQuery({
    queryKey: ['dashboard-metrics-timeseries', filters, timeseriesMetric, groupBy],
    queryFn: () => getMetricsTimeseries(filters, timeseriesMetric, groupBy),
  });

  const topCoursesQuery = useQuery({
    queryKey: ['dashboard-metrics-top-courses', filters, topBy],
    queryFn: () => getMetricsTopCourses(filters, topBy),
  });

  const riskStudentsQuery = useQuery({
    queryKey: ['dashboard-metrics-risk-students', filters],
    queryFn: () => getMetricsRiskStudents(filters, 14),
  });

  const psychologistRiskQuery = useQuery({
    queryKey: ['dashboard-psychologist-risk'],
    queryFn: async () =>
      (
        await api.get<{
          buckets: Array<{ label: string; key: string; value: number }>;
          waitingThreads: number;
          totalOpenThreads: number;
        }>('/psychologist-chat/risk-summary')
      ).data,
    enabled: role === 'ADMIN' || role === 'PSICOLOGO',
  });

  const isLoading =
    overviewQuery.isLoading ||
    filtersQuery.isLoading ||
    timeseriesQuery.isLoading ||
    topCoursesQuery.isLoading ||
    riskStudentsQuery.isLoading;

  const hasError =
    overviewQuery.isError ||
    filtersQuery.isError ||
    timeseriesQuery.isError ||
    topCoursesQuery.isError ||
    riskStudentsQuery.isError ||
    (psychologistRiskQuery.isError && psychologistRiskQuery.isFetched);

  const summary = overviewQuery.data?.summary;
  const topStudents = overviewQuery.data?.tables.topStudents ?? [];
  const statusDistribution = overviewQuery.data?.distributions.statusDistribution ?? [];
  const efficiencyByCourse = overviewQuery.data?.distributions.efficiencyByCourse ?? [];
  const completionByCourse = overviewQuery.data?.distributions.completionByCourse ?? [];

  const periodLabel = `${from} a ${to}`;

  function applyPreset(nextPreset: DatePreset) {
    setPreset(nextPreset);
    const nextRange = presetRange(nextPreset);
    setFrom(nextRange.from);
    setTo(nextRange.to);
  }

  function resetFilters() {
    const next = presetRange('30d');
    setPreset('30d');
    setFrom(next.from);
    setTo(next.to);
    setCourseId('');
    setGroupId('');
    setGroupBy('day');
    setTimeseriesMetric('quizzes');
    setTopBy('efficiency');
  }

  function retryAll() {
    overviewQuery.refetch();
    filtersQuery.refetch();
    timeseriesQuery.refetch();
    topCoursesQuery.refetch();
    riskStudentsQuery.refetch();
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Dashboard" description="Indicadores executivos e operacionais da plataforma." />
        <LoadingSkeletonDashboard />
      </div>
    );
  }

  if (hasError || !summary) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Dashboard" description="Indicadores executivos e operacionais da plataforma." />
        <ErrorState message="Falha ao carregar métricas do dashboard." onRetry={retryAll} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-6">
        <PageHeader
          title="Dashboard"
          description="Visão executiva e operacional com eficiência, progresso e riscos da plataforma."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={retryAll}>
                <RefreshCcw size={16} />
                Atualizar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    Ações rápidas
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/ranking')}>Abrir ranking</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/courses')}>Abrir cursos</DropdownMenuItem>
                  <DropdownMenuItem onClick={resetFilters}>Limpar filtros</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        <DashboardFilters
          from={from}
          to={to}
          courseId={courseId}
          groupId={groupId}
          courses={filtersQuery.data?.courses ?? []}
          groups={filtersQuery.data?.groups ?? []}
          preset={preset}
          onPresetChange={applyPreset}
          onFromChange={setFrom}
          onToChange={setTo}
          onCourseChange={setCourseId}
          onGroupChange={setGroupId}
          onReset={resetFilters}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KPIStatCard
            title="Alunos ativos"
            value={String(summary.activeStudents)}
            description={periodLabel}
            icon={<Users size={16} />}
          />
          <KPIStatCard
            title="Novos alunos"
            value={String(summary.newStudents)}
            description="Cadastros no período"
            icon={<UserPlus size={16} />}
          />
          <KPIStatCard
            title="Aulas concluídas"
            value={String(summary.lessonsCompleted)}
            description="Conclusões no período"
            icon={<BookOpenCheck size={16} />}
          />
          <KPIStatCard
            title="Quizzes realizados"
            value={String(summary.quizzesDone)}
            description="Tentativas registradas"
            icon={<ClipboardCheck size={16} />}
          />
          <KPIStatCard
            title="Eficiência média"
            value={`${summary.avgEfficiency}%`}
            description="Pré vs pós + progresso"
            icon={<TrendingUp size={16} />}
            tag="Global"
          />
          <KPIStatCard
            title="Taxa de conclusão"
            value={`${summary.completionRate}%`}
            description="Média por curso"
            icon={<Gauge size={16} />}
          />
          <KPIStatCard
            title="Engajamento"
            value={`${summary.engagementRate}%`}
            description="Alunos com 3+ aulas"
            icon={<TrendingUp size={16} />}
          />
          <KPIStatCard
            title="Dúvidas em aberto"
            value={String(summary.openForumQuestions)}
            description="Fórum aguardando resposta"
            icon={<AlertTriangle size={16} />}
            tag={summary.openForumQuestions > 0 ? 'Atenção' : 'Controlado'}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Tendência do período"
            description="Acompanhe o ritmo diário/semanal de atividade."
            action={
              <div className="flex items-center gap-2">
                <Tabs value={timeseriesMetric} onValueChange={(value) => setTimeseriesMetric(value as TimeseriesMetric)}>
                  <TabsList>
                    <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                    <TabsTrigger value="lessons">Aulas</TabsTrigger>
                    <TabsTrigger value="signups">Cadastros</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Select value={groupBy} onChange={(event) => setGroupBy(event.target.value as 'day' | 'week')}>
                  <option value="day">Dia</option>
                  <option value="week">Semana</option>
                </Select>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseriesQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Distribuição de status"
            description="Quem ainda não começou, está em andamento ou já concluiu o ciclo."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={62}
                  paddingAngle={4}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className={`grid gap-4 ${role === 'ADMIN' || role === 'PSICOLOGO' ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
          <ChartCard title="Eficiência por curso" description="Top cursos no recorte selecionado.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyByCourse}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="efficiency" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Conclusão por curso" description="Percentual médio de progresso por curso.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionByCourse}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="completionRate" fill="#0369a1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {(role === 'ADMIN' || role === 'PSICOLOGO') && (
            <ChartCard
              title="Risco no Chat Psicólogo"
              description="Tempo que alunos aguardam resposta do psicólogo."
              action={
                <div className="text-xs text-muted-foreground">
                  {(psychologistRiskQuery.data?.waitingThreads ?? 0)}/
                  {(psychologistRiskQuery.data?.totalOpenThreads ?? 0)} aguardando resposta
                </div>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={psychologistRiskQuery.data?.buckets ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        <Separator />

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Top cursos" description="Comparativo orientado por objetivo de gestão.">
            <div className="mb-3">
              <Tabs value={topBy} onValueChange={(value) => setTopBy(value as TopCoursesBy)}>
                <TabsList>
                  <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
                  <TabsTrigger value="completion">Conclusão</TabsTrigger>
                  <TabsTrigger value="engagement">Engajamento</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <DataBlockTable
              headers={['Curso', 'Eficiência', 'Conclusão', 'Engajamento']}
              rows={(topCoursesQuery.data ?? []).slice(0, 6).map((course) => [
                course.title,
                `${course.efficiency}%`,
                `${course.completionRate}%`,
                `${course.engagement}%`,
              ])}
              emptyTitle="Sem cursos no período"
              emptyDescription="Aguardando atividade para montar o ranking de cursos."
            />
          </ChartCard>

          <ChartCard title="Top alunos" description="Melhores desempenhos no período filtrado.">
            <DataBlockTable
              headers={['Aluno', 'Eficiência', 'Quiz', 'Melhora']}
              rows={topStudents.map((student) => [
                <Tooltip key={`${student.userId}-name`}>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">{student.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Inicial: {student.initialQuizScore}% | Final: {student.finalQuizScore}%
                  </TooltipContent>
                </Tooltip>,
                `${student.efficiency}%`,
                `${student.finalQuizScore}%`,
                `${student.quizImprovement >= 0 ? '+' : ''}${student.quizImprovement}%`,
              ])}
              emptyTitle="Sem top alunos"
              emptyDescription="Quando houver dados de pré e pós quiz, os destaques aparecerão aqui."
            />
          </ChartCard>

          <ChartCard title="Alunos em risco" description="Baixa atividade, queda de desempenho ou sem avanço.">
            <DataBlockTable
              headers={['Aluno', 'Risco', 'Inativo', 'Melhora']}
              rows={(riskStudentsQuery.data ?? []).slice(0, 6).map((student) => [
                student.name,
                `${student.riskScore}`,
                `${student.inactivityDays}d`,
                `${student.quizImprovement >= 0 ? '+' : ''}${student.quizImprovement}%`,
              ])}
              emptyTitle="Sem alunos em risco"
              emptyDescription="Nenhum aluno crítico para o threshold atual (14 dias)."
            />
          </ChartCard>
        </div>
      </div>
    </TooltipProvider>
  );
}
