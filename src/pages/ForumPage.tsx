import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessageCirclePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/States';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export function ForumPage() {
  const qc = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);

  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerQuestionId, setAnswerQuestionId] = useState('');
  const [answerBody, setAnswerBody] = useState('');
  const [solvingAnswerId, setSolvingAnswerId] = useState('');
  const [deletingQuestionId, setDeletingQuestionId] = useState('');
  const [deletingAnswerId, setDeletingAnswerId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'SOLVED'>('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['forum'],
    queryFn: async () => (await api.get('/forum')).data,
  });

  const solveByAnswer = useMutation({
    mutationFn: async (answerId: string) => api.patch(`/forum/answers/${answerId}/solve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum'] });
      toast.success('Resposta marcada como solução.');
    },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, body }: { questionId: string; body: string }) =>
      api.post(`/forum/${questionId}/answers`, { body }),
    onSuccess: () => {
      setAnswerBody('');
      setAnswerQuestionId('');
      setAnswerModalOpen(false);
      qc.invalidateQueries({ queryKey: ['forum'] });
      toast.success('Resposta salva.');
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => api.delete(`/forum/${questionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum'] });
      toast.success('Pergunta excluída.');
    },
  });

  const deleteAnswer = useMutation({
    mutationFn: async (answerId: string) => api.delete(`/forum/answers/${answerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum'] });
      toast.success('Resposta excluída.');
    },
  });

  const filteredQuestions = (data ?? []).filter((question: any) => {
    if (statusFilter === 'ALL') return true;
    return question.status === statusFilter;
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Fórum"
        description="Acompanhe dúvidas dos alunos e respostas da equipe."
      />

      <SectionCard title="Perguntas" description="Discussões abertas e solucionadas.">
        <div className="mb-3 flex flex-wrap gap-2">
          <Button variant={statusFilter === 'ALL' ? 'default' : 'secondary'} size="sm" onClick={() => setStatusFilter('ALL')}>
            Todas
          </Button>
          <Button variant={statusFilter === 'OPEN' ? 'default' : 'secondary'} size="sm" onClick={() => setStatusFilter('OPEN')}>
            Não solucionadas
          </Button>
          <Button variant={statusFilter === 'SOLVED' ? 'default' : 'secondary'} size="sm" onClick={() => setStatusFilter('SOLVED')}>
            Solucionadas
          </Button>
        </div>

        {isLoading ? <LoadingState rows={4} /> : null}
        {isError ? <ErrorState message="Erro ao carregar fórum." onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && !filteredQuestions.length ? (
          <EmptyState
            title="Nenhuma pergunta para este filtro"
            description="Altere o filtro para visualizar outras discussões."
          />
        ) : null}

        <div className="grid gap-3">
          {filteredQuestions.map((q: any) => (
            <div key={q.id} className="rounded-lg border bg-card/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={q.status === 'SOLVED' ? 'secondary' : 'outline'}>
                  {q.status === 'SOLVED' ? 'Solucionada' : 'Aberta'}
                </Badge>
                {role === 'ADMIN' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    loading={deleteQuestion.isPending && deletingQuestionId === q.id}
                    disabled={deleteQuestion.isPending}
                    onClick={() => {
                      if (!window.confirm('Deseja excluir esta pergunta e todas as respostas?')) return;
                      setDeletingQuestionId(q.id);
                      deleteQuestion.mutate(q.id, {
                        onError: (error: any) => {
                          toast.error(error?.response?.data?.message ?? 'Erro ao excluir pergunta.');
                        },
                        onSettled: () => setDeletingQuestionId(''),
                      });
                    }}
                  >
                    <Trash2 size={14} />
                    Excluir pergunta
                  </Button>
                ) : null}
              </div>

              <strong className="text-base">{q.title}</strong>
              <p className="mt-1 text-sm text-muted-foreground">{q.body}</p>

              {Array.isArray(q.answers) && q.answers.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  <strong className="text-sm">Respostas</strong>
                  {q.answers.map((ans: any) => (
                    <div key={ans.id} className="rounded-md border bg-muted/30 p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{ans.user?.name ?? 'Usuario'}</strong>
                        {ans.user?.role === 'PROFESSOR' ? <Badge variant="outline">Professor</Badge> : null}
                        {ans.isAi ? <Badge>IA</Badge> : null}
                        {(q.solutionAnswerId === ans.id || q.solutionAnswer?.id === ans.id) ? (
                          <Badge variant="secondary">Solução escolhida</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm">{ans.body}</p>
                      {role === 'ADMIN' ? (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            loading={deleteAnswer.isPending && deletingAnswerId === ans.id}
                            disabled={deleteAnswer.isPending}
                            onClick={() => {
                              if (!window.confirm('Deseja excluir esta resposta?')) return;
                              setDeletingAnswerId(ans.id);
                              deleteAnswer.mutate(ans.id, {
                                onError: (error: any) => {
                                  toast.error(error?.response?.data?.message ?? 'Erro ao excluir resposta.');
                                },
                                onSettled: () => setDeletingAnswerId(''),
                              });
                            }}
                          >
                            <Trash2 size={14} />
                            Excluir resposta
                          </Button>
                        </div>
                      ) : null}
                      {(role === 'PROFESSOR' || role === 'ADMIN') && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant={q.solutionAnswerId === ans.id || q.solutionAnswer?.id === ans.id ? 'secondary' : 'default'}
                            loading={solveByAnswer.isPending && solvingAnswerId === ans.id}
                            disabled={solveByAnswer.isPending}
                            onClick={() => {
                              setSolvingAnswerId(ans.id);
                              solveByAnswer.mutate(ans.id, {
                                onError: (error: any) => {
                                  toast.error(error?.response?.data?.message ?? 'Erro ao marcar solução.');
                                },
                                onSettled: () => setSolvingAnswerId(''),
                              });
                            }}
                          >
                            <CheckCircle2 size={14} />
                            {q.solutionAnswerId === ans.id || q.solutionAnswer?.id === ans.id
                              ? 'Resposta marcada'
                              : 'Marcar como solução'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {(role === 'PROFESSOR' || role === 'ADMIN') && q.status !== 'SOLVED' && !q.solutionAnswerId && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAnswerQuestionId(q.id);
                      setAnswerModalOpen(true);
                    }}
                  >
                    <MessageCirclePlus size={16} />
                    Adicionar resposta
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal title="Adicionar resposta" open={answerModalOpen} onClose={() => setAnswerModalOpen(false)}>
        <div className="grid gap-4">
          <FormField id="answer-body" label="Resposta">
            <Textarea
              id="answer-body"
              placeholder="Digite a resposta para a dúvida"
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              className="min-h-[120px]"
            />
          </FormField>
          <Button
            loading={answerMutation.isPending}
            disabled={answerMutation.isPending}
            onClick={() => {
              if (!answerBody.trim() || !answerQuestionId) {
                toast.error('Escreva a resposta antes de salvar.');
                return;
              }
              answerMutation.mutate({ questionId: answerQuestionId, body: answerBody.trim() });
            }}
          >
            Salvar resposta
          </Button>
        </div>
      </Modal>
    </div>
  );
}
