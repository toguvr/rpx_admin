import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';

export function FeedbackPage() {
  const qc = useQueryClient();
  const { data: form, isLoading } = useQuery({
    queryKey: ['feedback-form-admin'],
    queryFn: async () => (await api.get('/feedback-form/admin')).data,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [questionPrompt, setQuestionPrompt] = useState('');
  const [questionRequired, setQuestionRequired] = useState(true);
  const [orderedQuestions, setOrderedQuestions] = useState<any[]>([]);
  const [draggingQuestionId, setDraggingQuestionId] = useState('');
  const [dragOverQuestionId, setDragOverQuestionId] = useState('');
  const [questionOrderBeforeDrag, setQuestionOrderBeforeDrag] = useState<string[]>([]);

  useEffect(() => {
    setTitle(form?.title ?? '');
    setDescription(form?.description ?? '');
    setIsActive(form?.isActive ?? true);
    setOrderedQuestions([...(form?.questions ?? [])].sort((a: any, b: any) => a.order - b.order));
  }, [form]);

  function resetQuestionForm() {
    setEditingQuestionId('');
    setQuestionPrompt('');
    setQuestionRequired(true);
  }

  function fillQuestionForm(question: any) {
    setEditingQuestionId(question.id);
    setQuestionPrompt(question.prompt ?? '');
    setQuestionRequired(Boolean(question.required));
  }

  function reorderList<T extends { id: string }>(items: T[], fromId: string, toId: string) {
    const from = items.findIndex((item) => item.id === fromId);
    const to = items.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0 || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  const saveForm = useMutation({
    mutationFn: async () =>
      api.put('/feedback-form/admin', {
        formId: form?.id,
        title,
        description,
        isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-form-admin'] });
      toast.success('Questionário salvo com sucesso.');
    },
  });

  const createQuestion = useMutation({
    mutationFn: async () =>
      api.post('/feedback-form/admin/questions', {
        formId: form?.id,
        prompt: questionPrompt,
        required: questionRequired,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-form-admin'] });
      toast.success('Pergunta cadastrada com sucesso.');
      resetQuestionForm();
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async () =>
      api.put(`/feedback-form/admin/questions/${editingQuestionId}`, {
        prompt: questionPrompt,
        required: questionRequired,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-form-admin'] });
      toast.success('Pergunta atualizada com sucesso.');
      resetQuestionForm();
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => api.delete(`/feedback-form/admin/questions/${questionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-form-admin'] });
      toast.success('Pergunta excluída com sucesso.');
    },
  });

  const reorderQuestions = useMutation({
    mutationFn: async (questionIds: string[]) =>
      api.patch('/feedback-form/admin/questions/reorder', {
        formId: form?.id,
        questionIds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-form-admin'] });
      toast.success('Ordem das perguntas salva.');
    },
  });

  if (isLoading) {
    return <p>Carregando questionário...</p>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Feedback Final"
        description="Monte o questionário que o aluno responde ao concluir todos os cursos."
      />

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Configuração do questionário</h2>
          <p className="text-sm text-muted-foreground">
            O formulário ativo aparece para o aluno quando todo o percurso de cursos for concluído.
          </p>
        </div>

        <FormField id="feedback-title" label="Título">
          <Input id="feedback-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Conte como foi sua experiência" />
        </FormField>

        <FormField id="feedback-description" label="Descrição">
          <Textarea
            id="feedback-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mensagem curta de agradecimento ou contexto para o aluno."
          />
        </FormField>

        <FormField id="feedback-active" label="Status">
          <Select id="feedback-active" value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </Select>
        </FormField>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            loading={saveForm.isPending}
            disabled={saveForm.isPending}
            onClick={() => {
              if (!title.trim()) {
                toast.error('Informe um título para o questionário.');
                return;
              }
              saveForm.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.response?.data?.message ?? 'Erro ao salvar questionário.');
                },
              });
            }}
          >
            Salvar questionário
          </Button>
          {form ? <span className="text-sm text-muted-foreground">Respostas recebidas: {form._count?.responses ?? 0}</span> : null}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Perguntas</h2>
            <p className="text-sm text-muted-foreground">Todas as perguntas usam nota de 1 a 5.</p>
          </div>
          <Button
            onClick={() => {
              if (!form?.id) {
                toast.error('Salve o questionário antes de cadastrar perguntas.');
                return;
              }
              resetQuestionForm();
              setQuestionModalOpen(true);
            }}
          >
            <Icon name="plus" />
            Nova pergunta
          </Button>
        </div>

        {!orderedQuestions.length ? <p>Nenhuma pergunta cadastrada.</p> : null}

        {!!orderedQuestions.length && (
          <div className="grid gap-3">
            {orderedQuestions.map((question: any, index: number) => (
              <div
                key={question.id}
                draggable
                onDragStart={() => {
                  setDraggingQuestionId(question.id);
                  setQuestionOrderBeforeDrag(orderedQuestions.map((item: any) => item.id));
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!draggingQuestionId || draggingQuestionId === question.id || reorderQuestions.isPending) return;
                  setDragOverQuestionId(question.id);
                  setOrderedQuestions((prev) => reorderList(prev, draggingQuestionId, question.id));
                }}
                onDragLeave={() => {
                  if (dragOverQuestionId === question.id) setDragOverQuestionId('');
                }}
                onDrop={() => {
                  if (!draggingQuestionId || reorderQuestions.isPending || !form?.id) return;
                  const nextIds = orderedQuestions.map((item: any) => item.id);
                  const previousOrder = [...questionOrderBeforeDrag];
                  const changed =
                    previousOrder.length === nextIds.length &&
                    previousOrder.some((id, currentIndex) => id !== nextIds[currentIndex]);

                  setDragOverQuestionId('');
                  setDraggingQuestionId('');
                  setQuestionOrderBeforeDrag([]);

                  if (!changed) return;

                  reorderQuestions.mutate(nextIds, {
                    onError: (error: any) => {
                      if (previousOrder.length) {
                        setOrderedQuestions((prev) => {
                          const byId = new Map(prev.map((item: any) => [item.id, item]));
                          return previousOrder.map((id) => byId.get(id)).filter(Boolean) as any[];
                        });
                      }
                      toast.error(error?.response?.data?.message ?? 'Erro ao reordenar perguntas.');
                    },
                  });
                }}
                onDragEnd={() => {
                  setDraggingQuestionId('');
                  setDragOverQuestionId('');
                  setQuestionOrderBeforeDrag([]);
                }}
                style={{
                  border: '1px solid var(--primary-soft)',
                  borderRadius: 10,
                  padding: 12,
                  cursor: 'grab',
                  background: dragOverQuestionId === question.id ? 'var(--primary-soft)' : undefined,
                  boxShadow: dragOverQuestionId === question.id ? 'inset 0 0 0 1px var(--primary)' : undefined,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <strong>
                      {index + 1}. {question.prompt}
                    </strong>
                    <span className="text-sm text-muted-foreground">
                      Tipo: Nota de 1 a 5 • {question.required ? 'Obrigatória' : 'Opcional'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        fillQuestionForm(question);
                        setQuestionModalOpen(true);
                      }}
                    >
                      <Icon name="edit" />
                    </Button>
                    <Button
                      variant="destructive"
                      loading={deleteQuestion.isPending}
                      disabled={deleteQuestion.isPending}
                      onClick={() => {
                        if (!window.confirm('Deseja excluir esta pergunta?')) return;
                        deleteQuestion.mutate(question.id, {
                          onError: (error: any) => {
                            toast.error(error?.response?.data?.message ?? 'Erro ao excluir pergunta.');
                          },
                        });
                      }}
                    >
                      <Icon name="trash" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={editingQuestionId ? 'Editar pergunta' : 'Nova pergunta'}
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
      >
        <div className="grid gap-4">
          <FormField id="feedback-question-prompt" label="Pergunta">
            <Textarea
              id="feedback-question-prompt"
              value={questionPrompt}
              onChange={(e) => setQuestionPrompt(e.target.value)}
              placeholder="Ex.: O quanto o conteúdo ajudou na sua prática?"
            />
          </FormField>

          <FormField id="feedback-question-required" label="Obrigatoriedade">
            <Select
              id="feedback-question-required"
              value={questionRequired ? 'required' : 'optional'}
              onChange={(e) => setQuestionRequired(e.target.value === 'required')}
            >
              <option value="required">Obrigatória</option>
              <option value="optional">Opcional</option>
            </Select>
          </FormField>

          <div className="flex flex-wrap gap-3">
            <Button
              loading={createQuestion.isPending || updateQuestion.isPending}
              disabled={createQuestion.isPending || updateQuestion.isPending}
              onClick={() => {
                if (!form?.id) {
                  toast.error('Salve o questionário antes de cadastrar perguntas.');
                  return;
                }
                if (!questionPrompt.trim()) {
                  toast.error('Informe a pergunta.');
                  return;
                }

                const onError = (error: any) => {
                  toast.error(error?.response?.data?.message ?? 'Erro ao salvar pergunta.');
                };

                if (editingQuestionId) {
                  updateQuestion.mutate(undefined, {
                    onSuccess: () => setQuestionModalOpen(false),
                    onError,
                  });
                  return;
                }

                createQuestion.mutate(undefined, {
                  onSuccess: () => setQuestionModalOpen(false),
                  onError,
                });
              }}
            >
              {editingQuestionId ? 'Salvar alterações' : 'Cadastrar pergunta'}
            </Button>
            {editingQuestionId ? (
              <Button variant="secondary" onClick={resetQuestionForm}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Respostas enviadas</h2>
          <p className="text-sm text-muted-foreground">Acompanhe as notas dadas pelos alunos em cada pergunta.</p>
        </div>

        {!form?.responses?.length ? <p>Nenhuma resposta recebida ainda.</p> : null}

        {!!form?.responseSummary?.length && (
          <div className="mb-4 grid gap-2">
            {form.responseSummary.map((item: any) => (
              <div key={item.questionId} className="rounded-lg border p-3">
                <p className="font-medium">{item.prompt}</p>
                <p className="text-sm text-muted-foreground">
                  Média: {item.average ?? '-'} • Respostas: {item.totalAnswers}
                </p>
              </div>
            ))}
          </div>
        )}

        {!!form?.responses?.length && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Aluno</th>
                  <th className="py-2 pr-4">E-mail</th>
                  <th className="py-2 pr-4">Data</th>
                  {(form.questions ?? []).map((question: any) => (
                    <th key={question.id} className="py-2 pr-4">
                      {question.prompt}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.responses ?? []).map((response: any) => (
                  <tr key={response.id} className="border-b align-top">
                    <td className="py-2 pr-4">{response.user?.name ?? '-'}</td>
                    <td className="py-2 pr-4">{response.user?.email ?? '-'}</td>
                    <td className="py-2 pr-4">
                      {response.createdAt ? new Date(response.createdAt).toLocaleString('pt-BR') : '-'}
                    </td>
                    {(form.questions ?? []).map((question: any) => {
                      const answer = (response.answers ?? []).find((item: any) => item.questionId === question.id);
                      return (
                        <td key={`${response.id}-${question.id}`} className="py-2 pr-4 font-semibold">
                          {answer?.valueNumber ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
