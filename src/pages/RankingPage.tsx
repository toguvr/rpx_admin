import { useQuery } from '@tanstack/react-query';
import { CircleHelp, Download } from 'lucide-react';

import { Button } from '@/components/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/States';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/services/api';

export function RankingPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => (await api.get('/ranking')).data,
  });

  function exportCsv() {
    if (!data?.length) return;
    const lines = [
      'posicao,nome,eficiencia,notaFinal,evolucaoFinalInicial,aulasAssistidas,cursosConcluidos,tentativasFinal',
    ];
    for (const item of data) {
      lines.push(
        [
          item.position,
          item.name,
          item.efficiency,
          item.finalQuizScore,
          item.quizImprovement,
          item.completedLessons,
          item.coursesCompleted,
          item.postAttempts,
        ].join(','),
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranking.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <TooltipProvider>
      <div className="grid min-w-0 gap-6">
        <PageHeader
          title="Ranking"
          description="Classificação por eficiência considerando quiz final, progresso nas aulas e evolução (final - inicial)."
          actions={
            <Button onClick={exportCsv} disabled={!data?.length} className="w-full sm:w-auto">
              <Download size={16} />
              Exportar CSV
            </Button>
          }
        />

        <SectionCard
          title={
            <div className="flex items-center gap-2">
              <span>Classificação</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Explicar cálculo da classificação"
                  >
                    <CircleHelp size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs leading-relaxed">
                  A eficiência é calculada com 40% do progresso nas aulas, 40% da nota média do quiz final e 20% da
                  evolução média entre quiz final e inicial. A evolução é normalizada de -100..100 para 0..100 antes
                  de entrar na conta.
                </TooltipContent>
              </Tooltip>
            </div>
          }
          description="Ordenado por eficiência composta com evolução de desempenho."
        >
          {isLoading ? <LoadingState rows={5} /> : null}
          {isError ? <ErrorState message="Erro ao carregar ranking." onRetry={() => refetch()} /> : null}
          {!isLoading && !isError && !data?.length ? (
            <EmptyState title="Sem dados de ranking" description="As métricas serão exibidas quando houver tentativas de quiz." />
          ) : null}
          {!!data?.length && (
            <div className="min-w-0 overflow-x-auto">
              <Table className="min-w-[620px] sm:min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Eficiência</TableHead>
                    <TableHead>Quiz final</TableHead>
                    <TableHead>Evolução</TableHead>
                    <TableHead>Aulas assistidas</TableHead>
                    <TableHead>Cursos concluídos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.map((row: any) => (
                    <TableRow key={row.userId}>
                      <TableCell>{row.position}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.efficiency}%</TableCell>
                      <TableCell>{row.finalQuizScore}%</TableCell>
                      <TableCell>{row.quizImprovement >= 0 ? `+${row.quizImprovement}%` : `${row.quizImprovement}%`}</TableCell>
                      <TableCell>{row.completedLessons}</TableCell>
                      <TableCell>{row.coursesCompleted}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>
    </TooltipProvider>
  );
}
