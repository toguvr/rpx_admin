import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

type EditModalType = 'none' | 'quiz' | 'lesson';
type OptionKey = 'A' | 'B' | 'C' | 'D';

export function CourseDetailsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { courseId = '' } = useParams();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data,
  });

  const course = useMemo(() => (courses ?? []).find((item: any) => item.id === courseId), [courseId, courses]);

  const [maxAttempts, setMaxAttempts] = useState(1);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const [lessonOrder, setLessonOrder] = useState(1);
  const [lessonDurationSeconds, setLessonDurationSeconds] = useState<number | ''>('');

  const [editModalType, setEditModalType] = useState<EditModalType>('none');
  const [editingQuizId, setEditingQuizId] = useState('');
  const [editingQuizMaxAttempts, setEditingQuizMaxAttempts] = useState(1);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingLessonTitle, setEditingLessonTitle] = useState('');
  const [editingLessonDescription, setEditingLessonDescription] = useState('');
  const [editingLessonVideoFile, setEditingLessonVideoFile] = useState<File | null>(null);
  const [editingLessonOrder, setEditingLessonOrder] = useState(1);
  const [editingLessonDurationSeconds, setEditingLessonDurationSeconds] = useState<number | ''>('');

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuizForQuestionsId, setSelectedQuizForQuestionsId] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [questionStatement, setQuestionStatement] = useState('');
  const [questionOrder, setQuestionOrder] = useState(1);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<OptionKey>('A');
  const [createQuizModalOpen, setCreateQuizModalOpen] = useState(false);
  const [createLessonModalOpen, setCreateLessonModalOpen] = useState(false);

  const { data: quizQuestions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['quiz-questions', selectedQuizForQuestionsId],
    queryFn: async () => (await api.get(`/quizzes/${selectedQuizForQuestionsId}/questions`)).data,
    enabled: questionModalOpen && Boolean(selectedQuizForQuestionsId),
  });

  useEffect(() => {
    if (course && !lessonTitle && !lessonDescription && !lessonVideoFile) {
      const nextOrder = (course.lessons?.length ?? 0) + 1;
      setLessonOrder(nextOrder);
    }
  }, [course, lessonDescription, lessonTitle, lessonVideoFile]);

  function closeEditModal() {
    setEditModalType('none');
    setEditingQuizId('');
    setEditingLessonId('');
    setEditingLessonVideoFile(null);
  }

  function resetQuestionForm() {
    setEditingQuestionId('');
    setQuestionStatement('');
    setQuestionOrder((quizQuestions?.length ?? 0) + 1);
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
  }

  function openQuestionManager(quiz: any) {
    setSelectedQuizForQuestionsId(quiz.id);
    setQuestionModalOpen(true);
    setEditingQuestionId('');
    setQuestionStatement('');
    setQuestionOrder(1);
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
    setQuestionOrder(question.order ?? 1);
    setOptionA(options[0]?.text ?? '');
    setOptionB(options[1]?.text ?? '');
    setOptionC(options[2]?.text ?? '');
    setOptionD(options[3]?.text ?? '');

    const correctIndex = options.findIndex((item: any) => item.isCorrect);
    const map: OptionKey[] = ['A', 'B', 'C', 'D'];
    setCorrectOption(map[correctIndex] ?? 'A');
  }

  async function uploadVideoToS3(file: File) {
    const { data: presign } = await api.post('/courses/videos/presign-upload', {
      courseId,
      fileName: file.name,
      contentType: file.type || 'video/mp4',
    });

    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        body: file,
      });
    } catch {
      throw new Error(
        'Falha de CORS ao enviar para S3. Configure o CORS da bucket para permitir PUT/GET/HEAD/OPTIONS do dominio do admin.',
      );
    }

    if (!uploadResponse.ok) {
      throw new Error('Falha no upload do video para o S3.');
    }

    return {
      videoKey: presign.key as string,
      videoOriginalName: file.name,
      videoMimeType: file.type || 'video/mp4',
    };
  }

  const createQuiz = useMutation({
    mutationFn: async () => api.post('/quizzes', { courseId, maxAttempts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      window.alert('Quiz cadastrado com sucesso.');
    },
  });

  const updateQuiz = useMutation({
    mutationFn: async () => api.put(`/quizzes/${editingQuizId}`, { maxAttempts: editingQuizMaxAttempts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      closeEditModal();
      window.alert('Quiz atualizado com sucesso.');
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: async (quizId: string) => api.delete(`/quizzes/${quizId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      window.alert('Quiz excluido com sucesso.');
      if (selectedQuizForQuestionsId) {
        setQuestionModalOpen(false);
        setSelectedQuizForQuestionsId('');
      }
    },
  });

  const createQuestion = useMutation({
    mutationFn: async () =>
      api.post('/quizzes/questions', {
        quizId: selectedQuizForQuestionsId,
        statement: questionStatement,
        order: questionOrder,
        options: [
          { text: optionA, isCorrect: correctOption === 'A' },
          { text: optionB, isCorrect: correctOption === 'B' },
          { text: optionC, isCorrect: correctOption === 'C' },
          { text: optionD, isCorrect: correctOption === 'D' },
        ],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', selectedQuizForQuestionsId] });
      window.alert('Pergunta cadastrada com sucesso.');
      resetQuestionForm();
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async () =>
      api.put(`/quizzes/questions/${editingQuestionId}`, {
        statement: questionStatement,
        order: questionOrder,
        options: [
          { text: optionA, isCorrect: correctOption === 'A' },
          { text: optionB, isCorrect: correctOption === 'B' },
          { text: optionC, isCorrect: correctOption === 'C' },
          { text: optionD, isCorrect: correctOption === 'D' },
        ],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', selectedQuizForQuestionsId] });
      window.alert('Pergunta atualizada com sucesso.');
      resetQuestionForm();
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => api.delete(`/quizzes/questions/${questionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-questions', selectedQuizForQuestionsId] });
      window.alert('Pergunta excluida com sucesso.');
      if (editingQuestionId) {
        resetQuestionForm();
      }
    },
  });

  const createLesson = useMutation({
    mutationFn: async () => {
      if (!lessonVideoFile) {
        throw new Error('Selecione um video para upload.');
      }

      const uploaded = await uploadVideoToS3(lessonVideoFile);

      return api.post(`/courses/${courseId}/lessons`, {
        title: lessonTitle,
        description: lessonDescription,
        videoKey: uploaded.videoKey,
        videoOriginalName: uploaded.videoOriginalName,
        videoMimeType: uploaded.videoMimeType,
        order: lessonOrder,
        durationSeconds: lessonDurationSeconds === '' ? undefined : Number(lessonDurationSeconds),
      });
    },
    onSuccess: () => {
      setLessonTitle('');
      setLessonDescription('');
      setLessonVideoFile(null);
      setLessonDurationSeconds('');
      qc.invalidateQueries({ queryKey: ['courses'] });
      window.alert('Aula cadastrada com sucesso.');
    },
  });

  const updateLesson = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: editingLessonTitle,
        description: editingLessonDescription,
        order: editingLessonOrder,
        durationSeconds:
          editingLessonDurationSeconds === '' ? undefined : Number(editingLessonDurationSeconds),
      };

      if (editingLessonVideoFile) {
        const uploaded = await uploadVideoToS3(editingLessonVideoFile);
        payload.videoKey = uploaded.videoKey;
        payload.videoOriginalName = uploaded.videoOriginalName;
        payload.videoMimeType = uploaded.videoMimeType;
      }

      return api.put(`/courses/lessons/${editingLessonId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      closeEditModal();
      window.alert('Aula atualizada com sucesso.');
    },
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => api.delete(`/courses/lessons/${lessonId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      window.alert('Aula excluida com sucesso.');
    },
  });

  if (isLoading) {
    return <p>Carregando curso...</p>;
  }

  if (!course) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h1 style={{ margin: 0 }}>Curso</h1>
          <Button onClick={() => navigate('/courses')}>Voltar</Button>
        </div>
        <Card>
          <p>Curso nao encontrado.</p>
        </Card>
      </div>
    );
  }

  const lessons = course.lessons ?? [];
  const quizzes = course.quizzes ?? [];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>{course.title}</h1>
          <p style={{ margin: '6px 0', color: 'var(--gray-1)' }}>{course.description}</p>
        </div>
        <Button onClick={() => navigate('/courses')}>Voltar para cursos</Button>
      </div>

      <Card style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Quizzes cadastrados</h2>
          <button
            type="button"
            aria-label="Adicionar quiz"
            onClick={() => setCreateQuizModalOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            +
          </button>
        </div>
        {!quizzes.length && <p>Nenhum quiz cadastrado para este curso.</p>}
        {!!quizzes.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Quiz</th>
                  <th align="left">Max. tentativas</th>
                  <th align="left">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz: any) => (
                  <tr key={quiz.id} style={{ borderTop: '1px solid var(--primary-soft)' }}>
                    <td style={{ padding: '8px 0' }}>Quiz do curso</td>
                    <td>{quiz.maxAttempts}</td>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button onClick={() => openQuestionManager(quiz)}>Perguntas e respostas</Button>
                        <Button
                          style={{ background: 'var(--gray-1)' }}
                          onClick={() => {
                            setEditingQuizId(quiz.id);
                            setEditingQuizMaxAttempts(quiz.maxAttempts ?? 1);
                            setEditModalType('quiz');
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          style={{ background: 'var(--error)' }}
                          loading={deleteQuiz.isPending}
                          disabled={deleteQuiz.isPending}
                          onClick={() => {
                            if (!window.confirm('Deseja excluir este quiz?')) {
                              return;
                            }
                            deleteQuiz.mutate(quiz.id, {
                              onError: (error: any) => {
                                window.alert(error?.response?.data?.message ?? 'Erro ao excluir quiz.');
                              },
                            });
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Aulas cadastradas</h2>
          <button
            type="button"
            aria-label="Adicionar aula"
            onClick={() => setCreateLessonModalOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            +
          </button>
        </div>
        {!lessons.length && <p>Nenhuma aula cadastrada para este curso.</p>}
        {!!lessons.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Titulo</th>
                  <th align="left">Ordem</th>
                  <th align="left">Duracao</th>
                  <th align="left">Video</th>
                  <th align="left">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson: any) => (
                  <tr key={lesson.id} style={{ borderTop: '1px solid var(--primary-soft)' }}>
                    <td style={{ padding: '8px 0' }}>{lesson.title}</td>
                    <td>{lesson.order}</td>
                    <td>{lesson.durationSeconds ? `${lesson.durationSeconds}s` : '-'}</td>
                    <td>{lesson.videoOriginalName ?? lesson.videoKey ?? 'Video enviado'}</td>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          style={{ background: 'var(--gray-1)' }}
                          onClick={() => {
                            setEditingLessonId(lesson.id);
                            setEditingLessonTitle(lesson.title ?? '');
                            setEditingLessonDescription(lesson.description ?? '');
                            setEditingLessonOrder(lesson.order ?? 1);
                            setEditingLessonDurationSeconds(lesson.durationSeconds ?? '');
                            setEditingLessonVideoFile(null);
                            setEditModalType('lesson');
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          style={{ background: 'var(--error)' }}
                          loading={deleteLesson.isPending}
                          disabled={deleteLesson.isPending}
                          onClick={() => {
                            if (!window.confirm(`Deseja excluir a aula "${lesson.title}"?`)) {
                              return;
                            }
                            deleteLesson.mutate(lesson.id, {
                              onError: (error: any) => {
                                window.alert(error?.response?.data?.message ?? 'Erro ao excluir aula.');
                              },
                            });
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal title="Cadastrar quiz" open={createQuizModalOpen} onClose={() => setCreateQuizModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Maximo de tentativas
            <input
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
            />
          </label>
          <Button
            loading={createQuiz.isPending}
            disabled={createQuiz.isPending}
            onClick={() => {
              if (!courseId) {
                window.alert('Curso invalido.');
                return;
              }
              if (maxAttempts < 1) {
                window.alert('Informe um numero de tentativas valido.');
                return;
              }
              createQuiz.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.response?.data?.message ?? 'Erro ao cadastrar quiz.');
                },
                onSuccess: () => setCreateQuizModalOpen(false),
              });
            }}
          >
            Cadastrar quiz
          </Button>
        </div>
      </Modal>

      <Modal title="Cadastrar aula" open={createLessonModalOpen} onClose={() => setCreateLessonModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Titulo da aula
            <input
              placeholder="Ex: Assistindo aulas em video"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </label>
          <label>
            Descricao
            <textarea
              placeholder="Descreva o conteudo da aula"
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
            />
          </label>
          <label>
            Arquivo de video
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setLessonVideoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Ordem da aula
            <input
              type="number"
              min={1}
              placeholder="Ex: 1"
              value={lessonOrder}
              onChange={(e) => setLessonOrder(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            Duracao em segundos (opcional)
            <input
              type="number"
              min={0}
              placeholder="Ex: 600"
              value={lessonDurationSeconds}
              onChange={(e) => setLessonDurationSeconds(e.target.value ? Number(e.target.value) : '')}
            />
          </label>
          <Button
            loading={createLesson.isPending}
            disabled={createLesson.isPending}
            onClick={() => {
              if (!lessonTitle.trim() || !lessonDescription.trim() || !lessonVideoFile) {
                window.alert('Preencha titulo, descricao e selecione o video.');
                return;
              }
              createLesson.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.message ?? 'Erro ao adicionar aula.');
                },
                onSuccess: () => setCreateLessonModalOpen(false),
              });
            }}
          >
            Cadastrar aula
          </Button>
        </div>
      </Modal>

      <Modal title="Perguntas e respostas do quiz" open={questionModalOpen} onClose={() => setQuestionModalOpen(false)}>
        <div style={{ display: 'grid', gap: 12 }}>
          {loadingQuestions && <p>Carregando perguntas...</p>}
          {!loadingQuestions && (
            <div style={{ display: 'grid', gap: 8 }}>
              <strong>Perguntas cadastradas</strong>
              {!quizQuestions?.length && <p>Nenhuma pergunta cadastrada.</p>}
              {quizQuestions?.map((question: any) => (
                <div key={question.id} style={{ border: '1px solid var(--primary-soft)', borderRadius: 10, padding: 8 }}>
                  <strong>
                    {question.order}. {question.statement}
                  </strong>
                  <ul style={{ margin: '6px 0' }}>
                    {(question.options ?? []).map((option: any, index: number) => (
                      <li key={option.id}>
                        {['A', 'B', 'C', 'D'][index]}. {option.text} {option.isCorrect ? '(Correta)' : ''}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button style={{ background: 'var(--gray-1)' }} onClick={() => fillQuestionForm(question)}>
                      Editar
                    </Button>
                    <Button
                      style={{ background: 'var(--error)' }}
                      loading={deleteQuestion.isPending}
                      disabled={deleteQuestion.isPending}
                      onClick={() => {
                        if (!window.confirm('Deseja excluir esta pergunta?')) return;
                        deleteQuestion.mutate(question.id, {
                          onError: (error: any) => {
                            window.alert(error?.response?.data?.message ?? 'Erro ao excluir pergunta.');
                          },
                        });
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--primary-soft)', paddingTop: 12, display: 'grid', gap: 10 }}>
            <strong>{editingQuestionId ? 'Editar pergunta' : 'Nova pergunta'}</strong>
            <label>
              Ordem
              <input
                type="number"
                min={1}
                value={questionOrder}
                onChange={(e) => setQuestionOrder(Number(e.target.value) || 1)}
              />
            </label>
            <label>
              Enunciado
              <textarea value={questionStatement} onChange={(e) => setQuestionStatement(e.target.value)} />
            </label>
            <label>
              Resposta A
              <input value={optionA} onChange={(e) => setOptionA(e.target.value)} />
            </label>
            <label>
              Resposta B
              <input value={optionB} onChange={(e) => setOptionB(e.target.value)} />
            </label>
            <label>
              Resposta C
              <input value={optionC} onChange={(e) => setOptionC(e.target.value)} />
            </label>
            <label>
              Resposta D
              <input value={optionD} onChange={(e) => setOptionD(e.target.value)} />
            </label>
            <label>
              Resposta correta
              <select
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value as OptionKey)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                loading={createQuestion.isPending || updateQuestion.isPending}
                disabled={createQuestion.isPending || updateQuestion.isPending}
                onClick={() => {
                  if (!selectedQuizForQuestionsId) {
                    window.alert('Quiz invalido.');
                    return;
                  }
                  if (
                    !questionStatement.trim() ||
                    !optionA.trim() ||
                    !optionB.trim() ||
                    !optionC.trim() ||
                    !optionD.trim()
                  ) {
                    window.alert('Preencha enunciado e todas as respostas.');
                    return;
                  }
                  if (editingQuestionId) {
                    updateQuestion.mutate(undefined, {
                      onError: (error: any) => {
                        window.alert(error?.response?.data?.message ?? 'Erro ao atualizar pergunta.');
                      },
                    });
                    return;
                  }

                  createQuestion.mutate(undefined, {
                    onError: (error: any) => {
                      window.alert(error?.response?.data?.message ?? 'Erro ao cadastrar pergunta.');
                    },
                  });
                }}
              >
                {editingQuestionId ? 'Salvar alteracoes' : 'Cadastrar pergunta'}
              </Button>
              {editingQuestionId && (
                <Button style={{ background: 'var(--gray-1)' }} onClick={resetQuestionForm}>
                  Cancelar edicao
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal title="Editar quiz" open={editModalType === 'quiz'} onClose={closeEditModal}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Maximo de tentativas
            <input
              type="number"
              min={1}
              value={editingQuizMaxAttempts}
              onChange={(e) => setEditingQuizMaxAttempts(Number(e.target.value) || 1)}
            />
          </label>
          <Button
            loading={updateQuiz.isPending}
            disabled={updateQuiz.isPending}
            onClick={() => {
              if (!editingQuizId) {
                window.alert('Quiz invalido.');
                return;
              }
              if (editingQuizMaxAttempts < 1) {
                window.alert('Informe um maximo de tentativas valido.');
                return;
              }
              updateQuiz.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.response?.data?.message ?? 'Erro ao atualizar quiz.');
                },
              });
            }}
          >
            Salvar alteracoes
          </Button>
        </div>
      </Modal>

      <Modal title="Editar aula" open={editModalType === 'lesson'} onClose={closeEditModal}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Titulo da aula
            <input
              value={editingLessonTitle}
              onChange={(e) => setEditingLessonTitle(e.target.value)}
            />
          </label>
          <label>
            Descricao
            <textarea
              value={editingLessonDescription}
              onChange={(e) => setEditingLessonDescription(e.target.value)}
            />
          </label>
          <label>
            Ordem da aula
            <input
              type="number"
              min={1}
              value={editingLessonOrder}
              onChange={(e) => setEditingLessonOrder(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            Duracao em segundos (opcional)
            <input
              type="number"
              min={0}
              value={editingLessonDurationSeconds}
              onChange={(e) =>
                setEditingLessonDurationSeconds(e.target.value ? Number(e.target.value) : '')
              }
            />
          </label>
          <label>
            Substituir video (opcional)
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setEditingLessonVideoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            loading={updateLesson.isPending}
            disabled={updateLesson.isPending}
            onClick={() => {
              if (!editingLessonId) {
                window.alert('Aula invalida.');
                return;
              }
              if (!editingLessonTitle.trim() || !editingLessonDescription.trim()) {
                window.alert('Preencha titulo e descricao.');
                return;
              }
              updateLesson.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.response?.data?.message ?? error?.message ?? 'Erro ao atualizar aula.');
                },
              });
            }}
          >
            Salvar alteracoes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
