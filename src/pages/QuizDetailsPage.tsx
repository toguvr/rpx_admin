import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/shared/FormField';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';

type OptionKey = 'A' | 'B' | 'C' | 'D';

export function QuizDetailsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { courseId = '', quizId = '' } = useParams();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data,
  });

  const course = useMemo(() => (courses ?? []).find((item: any) => item.id === courseId), [courseId, courses]);
  const quiz = useMemo(() => (course?.quizzes ?? []).find((item: any) => item.id === quizId), [course, quizId]);

  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => (await api.get(`/quizzes/${quizId}/questions`)).data,
    enabled: Boolean(quizId),
  });

  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [questionStatement, setQuestionStatement] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<OptionKey>('A');
  const [editingQuizMaxAttempts, setEditingQuizMaxAttempts] = useState(1);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [draggingQuestionId, setDraggingQuestionId] = useState('');
  const [dragOverQuestionId, setDragOverQuestionId] = useState('');
  const [questionOrderBeforeDrag, setQuestionOrderBeforeDrag] = useState<string[]>([]);
  const [orderedQuestions, setOrderedQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (quiz?.maxAttempts) {
      setEditingQuizMaxAttempts(quiz.maxAttempts);
    }
  }, [quiz]);

  useEffect(() => {
    setOrderedQuestions([...(questions ?? [])].sort((a: any, b: any) => a.order - b.order));
  }, [questions]);

  function resetQuestionForm() {
    setEditingQuestionId('');
    setQuestionStatement('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
  }

  function fillQuestionForm(question: any) {
    const options = question.options ?? [];
    setEditingQuestionId(question.id);
    setQuestionStatement(question.statement ?? '');
    setOptionA(options[0]?.text ?? '');
    setOptionB(options[1]?.text ?? '');
    setOptionC(options[2]?.text ?? '');
    setOptionD(options[3]?.text ?? '');
    const correctIndex = options.findIndex((item: any) => item.isCorrect);
    const map: OptionKey[] = ['A', 'B', 'C', 'D'];
    setCorrectOption(map[correctIndex] ?? 'A');
  }

  const updateQuiz = useMutation({
    mutationFn: async () => api.put(`/quizzes/${quizId}`, { maxAttempts: editingQuizMaxAttempts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Quiz atualizado com sucesso.');
    },
  });

  const createQuestion = useMutation({
    mutationFn: async () =>
      api.post('/quizzes/questions', {
        quizId,
        statement: questionStatement,
        options: [
          { text: optionA, isCorrect: correctOption === 'A' },
          { text: optionB, isCorrect: correctOption === 'B' },
          { text: optionC, isCorrect: correctOption === 'C' },
          { text: optionD, isCorrect: correctOption === 'D' },
        ],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast.success('Pergunta cadastrada com sucesso.');
      resetQuestionForm();
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async () =>
      api.put(`/quizzes/questions/${editingQuestionId}`, {
        statement: questionStatement,
        options: [
          { text: optionA, isCorrect: correctOption === 'A' },
          { text: optionB, isCorrect: correctOption === 'B' },
          { text: optionC, isCorrect: correctOption === 'C' },
          { text: optionD, isCorrect: correctOption === 'D' },
        ],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast.success('Pergunta atualizada com sucesso.');
      resetQuestionForm();
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => api.delete(`/quizzes/questions/${questionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast.success('Pergunta excluida com sucesso.');
    },
  });

  const reorderQuestions = useMutation({
    mutationFn: async (questionIds: string[]) =>
      api.patch(`/quizzes/${quizId}/questions/reorder`, { questionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
    },
  });

  if (isLoading) return <p>Carregando quiz...</p>;

  if (!course || !quiz) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <Button onClick={() => navigate('/courses')}>Voltar</Button>
        <Card>
          <p>Quiz não encontrado.</p>
        </Card>
      </div>
    );
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

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ margin: 0 }}>Quiz do curso</h1>
          <p style={{ margin: '6px 0', color: 'var(--gray-1)' }}>{course.title}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/courses/${courseId}`)}>
          Voltar para curso
        </Button>
      </div>

      <Card>
        <h2>Configuração</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px]">
            <FormField id="quiz-max-attempts" label="Máximo de tentativas">
              <Input
                id="quiz-max-attempts"
                type="number"
                min={1}
                value={editingQuizMaxAttempts}
                onChange={(e) => setEditingQuizMaxAttempts(Number(e.target.value) || 1)}
              />
            </FormField>
          </div>
          <Button
            loading={updateQuiz.isPending}
            disabled={updateQuiz.isPending}
            onClick={() => {
              if (editingQuizMaxAttempts < 1) {
                toast.error('Informe um máximo de tentativas válido.');
                return;
              }
              updateQuiz.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.response?.data?.message ?? 'Erro ao atualizar quiz.');
                },
              });
            }}
          >
            Salvar
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Perguntas cadastradas</h2>
        <Button
          style={{ marginBottom: 10 }}
          onClick={() => {
            resetQuestionForm();
            setQuestionModalOpen(true);
          }}
        >
          <Icon name="plus" />
        </Button>
        {loadingQuestions && <p>Carregando perguntas...</p>}
        {!loadingQuestions && !orderedQuestions.length && <p>Nenhuma pergunta cadastrada.</p>}
        {!!orderedQuestions.length && (
          <div style={{ display: 'grid', gap: 10 }}>
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
                  if (dragOverQuestionId === question.id) {
                    setDragOverQuestionId('');
                  }
                }}
                onDrop={() => {
                  if (!draggingQuestionId || reorderQuestions.isPending) return;
                  const next = orderedQuestions;
                  const previousOrder = [...questionOrderBeforeDrag];
                  const nextIds = next.map((item: any) => item.id);
                  const changed =
                    previousOrder.length === nextIds.length &&
                    previousOrder.some((id, index) => id !== nextIds[index]);

                  setDragOverQuestionId('');
                  setDraggingQuestionId('');
                  setQuestionOrderBeforeDrag([]);

                  if (!changed) return;

                  reorderQuestions.mutate(nextIds, {
                    onSuccess: () => {
                      toast.success('Ordem das perguntas salva.');
                    },
                    onError: (error: any) => {
                      if (previousOrder.length) {
                        setOrderedQuestions((prev) => {
                          const byId = new Map(prev.map((item: any) => [item.id, item]));
                          return previousOrder
                            .map((id) => byId.get(id))
                            .filter(Boolean) as any[];
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
                  padding: 10,
                  cursor: 'grab',
                  background: dragOverQuestionId === question.id ? 'var(--primary-soft)' : undefined,
                  boxShadow:
                    dragOverQuestionId === question.id ? 'inset 0 0 0 1px var(--primary)' : undefined,
                }}
              >
                <strong>
                  {index + 1}. {question.statement}
                </strong>
                <ul style={{ margin: '6px 0' }}>
                  {(question.options ?? []).map((option: any, index: number) => (
                    <li key={option.id}>
                      {['A', 'B', 'C', 'D'][index]}. {option.text} {option.isCorrect ? '(Correta)' : ''}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    aria-label="Editar pergunta"
                    title="Editar pergunta"
                    onClick={() => {
                      fillQuestionForm(question);
                      setQuestionModalOpen(true);
                    }}
                  >
                    <Icon name="edit" />
                  </Button>
                  <Button
                    variant="destructive"
                    aria-label="Excluir pergunta"
                    title="Excluir pergunta"
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
          <FormField id="question-statement" label="Enunciado">
            <Textarea id="question-statement" value={questionStatement} onChange={(e) => setQuestionStatement(e.target.value)} />
          </FormField>
          <FormField id="question-option-a" label="Resposta A">
            <Input id="question-option-a" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
          </FormField>
          <FormField id="question-option-b" label="Resposta B">
            <Input id="question-option-b" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
          </FormField>
          <FormField id="question-option-c" label="Resposta C">
            <Input id="question-option-c" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
          </FormField>
          <FormField id="question-option-d" label="Resposta D">
            <Input id="question-option-d" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
          </FormField>
          <FormField id="question-correct-option" label="Resposta correta">
            <Select id="question-correct-option" value={correctOption} onChange={(e) => setCorrectOption(e.target.value as OptionKey)}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </Select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              loading={createQuestion.isPending || updateQuestion.isPending}
              disabled={createQuestion.isPending || updateQuestion.isPending}
              onClick={() => {
                if (!questionStatement.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
                  toast.error('Preencha enunciado e todas as respostas.');
                  return;
                }
                if (editingQuestionId) {
                  updateQuestion.mutate(undefined, {
                    onSuccess: () => setQuestionModalOpen(false),
                    onError: (error: any) => {
                      toast.error(error?.response?.data?.message ?? 'Erro ao atualizar pergunta.');
                    },
                  });
                  return;
                }
                createQuestion.mutate(undefined, {
                  onSuccess: () => setQuestionModalOpen(false),
                  onError: (error: any) => {
                    toast.error(error?.response?.data?.message ?? 'Erro ao cadastrar pergunta.');
                  },
                });
              }}
            >
              {editingQuestionId ? 'Salvar alterações' : 'Cadastrar pergunta'}
            </Button>
            {editingQuestionId && (
              <Button variant="secondary" onClick={resetQuestionForm}>
                Cancelar edição
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
