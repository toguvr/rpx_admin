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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';

type EditModalType = 'none' | 'quiz' | 'lesson';
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
  const [lessonDurationSeconds, setLessonDurationSeconds] = useState<number | ''>('');
  const [draggingQuizId, setDraggingQuizId] = useState('');
  const [dragOverQuizId, setDragOverQuizId] = useState('');
  const [quizOrderBeforeDrag, setQuizOrderBeforeDrag] = useState<string[]>([]);
  const [draggingLessonId, setDraggingLessonId] = useState('');
  const [dragOverLessonId, setDragOverLessonId] = useState('');
  const [lessonOrderBeforeDrag, setLessonOrderBeforeDrag] = useState<string[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  const [editModalType, setEditModalType] = useState<EditModalType>('none');
  const [editingQuizId, setEditingQuizId] = useState('');
  const [editingQuizMaxAttempts, setEditingQuizMaxAttempts] = useState(1);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingLessonTitle, setEditingLessonTitle] = useState('');
  const [editingLessonDescription, setEditingLessonDescription] = useState('');
  const [editingLessonVideoFile, setEditingLessonVideoFile] = useState<File | null>(null);
  const [editingLessonDurationSeconds, setEditingLessonDurationSeconds] = useState<number | ''>('');

  const [createQuizModalOpen, setCreateQuizModalOpen] = useState(false);
  const [createLessonModalOpen, setCreateLessonModalOpen] = useState(false);
  const canCreateQuiz = Boolean(courseId) && maxAttempts >= 1;

  useEffect(() => {
    if (!course) {
      setLessons([]);
      setQuizzes([]);
      return;
    }

    setLessons([...(course.lessons ?? [])].sort((a: any, b: any) => a.order - b.order));
    setQuizzes([...(course.quizzes ?? [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
  }, [course]);

  function closeEditModal() {
    setEditModalType('none');
    setEditingQuizId('');
    setEditingLessonId('');
    setEditingLessonVideoFile(null);
  }

  function openQuestionManager(quiz: any) {
    navigate(`/courses/${courseId}/quizzes/${quiz.id}`);
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
      toast.success('Quiz cadastrado com sucesso.');
    },
  });

  const updateQuiz = useMutation({
    mutationFn: async () => api.put(`/quizzes/${editingQuizId}`, { maxAttempts: editingQuizMaxAttempts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      closeEditModal();
      toast.success('Quiz atualizado com sucesso.');
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: async (quizId: string) => api.delete(`/quizzes/${quizId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Quiz excluido com sucesso.');
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
        durationSeconds: lessonDurationSeconds === '' ? undefined : Number(lessonDurationSeconds),
      });
    },
    onSuccess: () => {
      setLessonTitle('');
      setLessonDescription('');
      setLessonVideoFile(null);
      setLessonDurationSeconds('');
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Aula cadastrada com sucesso.');
    },
  });

  const updateLesson = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: editingLessonTitle,
        description: editingLessonDescription,
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
      toast.success('Aula atualizada com sucesso.');
    },
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => api.delete(`/courses/lessons/${lessonId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Aula excluida com sucesso.');
    },
  });

  const reorderLessons = useMutation({
    mutationFn: async (lessonIds: string[]) =>
      api.patch(`/courses/${courseId}/lessons/reorder`, { lessonIds }),
  });

  const reorderQuizzes = useMutation({
    mutationFn: async (quizIds: string[]) =>
      api.patch('/quizzes/reorder', { courseId, quizIds }),
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
          <Button onClick={() => setCreateQuizModalOpen(true)}>
            <Icon name="plus" size={18} />
            Cadastrar quiz
          </Button>
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
                  <tr
                    key={quiz.id}
                    draggable
                    onDragStart={() => {
                      setDraggingQuizId(quiz.id);
                      setQuizOrderBeforeDrag(quizzes.map((item: any) => item.id));
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (!draggingQuizId || draggingQuizId === quiz.id || reorderQuizzes.isPending) return;
                      setDragOverQuizId(quiz.id);
                      setQuizzes((prev) => reorderList(prev, draggingQuizId, quiz.id));
                    }}
                    onDragLeave={() => {
                      if (dragOverQuizId === quiz.id) {
                        setDragOverQuizId('');
                      }
                    }}
                    onDrop={() => {
                      if (!draggingQuizId || reorderQuizzes.isPending) return;
                      const next = quizzes;
                      const previousOrder = [...quizOrderBeforeDrag];
                      const nextIds = next.map((item: any) => item.id);
                      const changed =
                        previousOrder.length === nextIds.length &&
                        previousOrder.some((id, index) => id !== nextIds[index]);

                      setDragOverQuizId('');
                      setDraggingQuizId('');
                      setQuizOrderBeforeDrag([]);

                      if (!changed) return;

                      reorderQuizzes.mutate(nextIds, {
                        onSuccess: () => {
                          toast.success('Ordem dos quizzes salva.');
                        },
                        onError: (error: any) => {
                          if (previousOrder.length) {
                            setQuizzes((prev) => {
                              const byId = new Map(prev.map((item: any) => [item.id, item]));
                              return previousOrder
                                .map((id) => byId.get(id))
                                .filter(Boolean) as any[];
                            });
                          }
                          toast.error(error?.response?.data?.message ?? 'Erro ao reordenar quizzes.');
                        },
                      });
                    }}
                    onDragEnd={() => {
                      setDraggingQuizId('');
                      setDragOverQuizId('');
                      setQuizOrderBeforeDrag([]);
                    }}
                    style={{
                      borderTop: '1px solid var(--primary-soft)',
                      cursor: 'grab',
                      background: dragOverQuizId === quiz.id ? 'var(--primary-soft)' : undefined,
                      boxShadow:
                        dragOverQuizId === quiz.id ? 'inset 0 0 0 1px var(--primary)' : undefined,
                    }}
                  >
                    <td style={{ padding: '8px 0' }}>
                      <button
                        type="button"
                        onClick={() => openQuestionManager(quiz)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Quiz do curso
                      </button>
                    </td>
                    <td>{quiz.maxAttempts}</td>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button aria-label="Abrir quiz" title="Abrir quiz" onClick={() => openQuestionManager(quiz)}>
                          <Icon name="open" />
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label="Editar quiz"
                          title="Editar quiz"
                          onClick={() => {
                            setEditingQuizId(quiz.id);
                            setEditingQuizMaxAttempts(quiz.maxAttempts ?? 1);
                            setEditModalType('quiz');
                          }}
                        >
                          <Icon name="edit" />
                        </Button>
                        <Button
                          variant="destructive"
                          loading={deleteQuiz.isPending}
                          disabled={deleteQuiz.isPending}
                          aria-label="Excluir quiz"
                          title="Excluir quiz"
                          onClick={() => {
                            if (!window.confirm('Deseja excluir este quiz?')) {
                              return;
                            }
                            deleteQuiz.mutate(quiz.id, {
                              onError: (error: any) => {
                                toast.error(error?.response?.data?.message ?? 'Erro ao excluir quiz.');
                              },
                            });
                          }}
                        >
                          <Icon name="trash" />
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
          <Button onClick={() => setCreateLessonModalOpen(true)}>
            <Icon name="plus" size={18} />
            Cadastrar aula
          </Button>
        </div>
        {!lessons.length && <p>Nenhuma aula cadastrada para este curso.</p>}
        {!!lessons.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Titulo</th>
                  <th align="left">Duracao</th>
                  <th align="left">Video</th>
                  <th align="left">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson: any) => (
                  <tr
                    key={lesson.id}
                    draggable
                    onDragStart={() => {
                      setDraggingLessonId(lesson.id);
                      setLessonOrderBeforeDrag(lessons.map((item: any) => item.id));
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (!draggingLessonId || draggingLessonId === lesson.id || reorderLessons.isPending) return;
                      setDragOverLessonId(lesson.id);
                      setLessons((prev) => reorderList(prev, draggingLessonId, lesson.id));
                    }}
                    onDragLeave={() => {
                      if (dragOverLessonId === lesson.id) {
                        setDragOverLessonId('');
                      }
                    }}
                    onDrop={() => {
                      if (!draggingLessonId || reorderLessons.isPending) return;
                      const next = lessons;
                      const previousOrder = [...lessonOrderBeforeDrag];
                      const nextIds = next.map((item: any) => item.id);
                      const changed =
                        previousOrder.length === nextIds.length &&
                        previousOrder.some((id, index) => id !== nextIds[index]);

                      setDragOverLessonId('');
                      setDraggingLessonId('');
                      setLessonOrderBeforeDrag([]);

                      if (!changed) return;

                      reorderLessons.mutate(nextIds, {
                        onSuccess: () => {
                          toast.success('Ordem das aulas salva.');
                        },
                        onError: (error: any) => {
                          if (previousOrder.length) {
                            setLessons((prev) => {
                              const byId = new Map(prev.map((item: any) => [item.id, item]));
                              return previousOrder
                                .map((id) => byId.get(id))
                                .filter(Boolean) as any[];
                            });
                          }
                          toast.error(error?.response?.data?.message ?? 'Erro ao reordenar aulas.');
                        },
                      });
                    }}
                    onDragEnd={() => {
                      setDraggingLessonId('');
                      setDragOverLessonId('');
                      setLessonOrderBeforeDrag([]);
                    }}
                    style={{
                      borderTop: '1px solid var(--primary-soft)',
                      cursor: 'grab',
                      background: dragOverLessonId === lesson.id ? 'var(--primary-soft)' : undefined,
                      boxShadow:
                        dragOverLessonId === lesson.id ? 'inset 0 0 0 1px var(--primary)' : undefined,
                    }}
                  >
                    <td style={{ padding: '8px 0' }}>{lesson.title}</td>
                    <td>{lesson.durationSeconds ? `${lesson.durationSeconds}s` : '-'}</td>
                    <td>{lesson.videoOriginalName ?? lesson.videoKey ?? 'Video enviado'}</td>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          variant="secondary"
                          aria-label="Editar aula"
                          title="Editar aula"
                          onClick={() => {
                            setEditingLessonId(lesson.id);
                            setEditingLessonTitle(lesson.title ?? '');
                            setEditingLessonDescription(lesson.description ?? '');
                            setEditingLessonDurationSeconds(lesson.durationSeconds ?? '');
                            setEditingLessonVideoFile(null);
                            setEditModalType('lesson');
                          }}
                        >
                          <Icon name="edit" />
                        </Button>
                        <Button
                          variant="destructive"
                          loading={deleteLesson.isPending}
                          disabled={deleteLesson.isPending}
                          aria-label="Excluir aula"
                          title="Excluir aula"
                          onClick={() => {
                            if (!window.confirm(`Deseja excluir a aula "${lesson.title}"?`)) {
                              return;
                            }
                            deleteLesson.mutate(lesson.id, {
                              onError: (error: any) => {
                                toast.error(error?.response?.data?.message ?? 'Erro ao excluir aula.');
                              },
                            });
                          }}
                        >
                          <Icon name="trash" />
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
        <div className="grid gap-4">
          <FormField id="create-quiz-max-attempts" label="Maximo de tentativas">
            <Input
              id="create-quiz-max-attempts"
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
            />
          </FormField>
          <Button
            loading={createQuiz.isPending}
            disabled={createQuiz.isPending || !canCreateQuiz}
            onClick={() => {
              createQuiz.mutate(undefined, {
                onSuccess: () => setCreateQuizModalOpen(false),
                onError: (error: any) => {
                  const message =
                    error?.response?.data?.message ??
                    'Nao foi possivel cadastrar quiz. Este curso aceita apenas um quiz base (antes e depois).';
                  toast.error(message);
                },
              });
            }}
          >
            Cadastrar quiz
          </Button>
        </div>
      </Modal>

      <Modal title="Cadastrar aula" open={createLessonModalOpen} onClose={() => setCreateLessonModalOpen(false)}>
        <div className="grid gap-4">
          <FormField id="lesson-title" label="Titulo da aula">
            <Input
              id="lesson-title"
              placeholder="Ex: Assistindo aulas em video"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </FormField>
          <FormField id="lesson-description" label="Descricao">
            <Textarea
              id="lesson-description"
              placeholder="Descreva o conteudo da aula"
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
            />
          </FormField>
          <FormField id="lesson-video-file" label="Arquivo de video">
            <Input
              id="lesson-video-file"
              type="file"
              accept="video/*"
              onChange={(e) => setLessonVideoFile(e.target.files?.[0] ?? null)}
            />
          </FormField>
          <FormField id="lesson-duration" label="Duracao em segundos (opcional)">
            <Input
              id="lesson-duration"
              type="number"
              min={0}
              placeholder="Ex: 600"
              value={lessonDurationSeconds}
              onChange={(e) => setLessonDurationSeconds(e.target.value ? Number(e.target.value) : '')}
            />
          </FormField>
          <Button
            loading={createLesson.isPending}
            disabled={createLesson.isPending}
            onClick={() => {
              if (!lessonTitle.trim() || !lessonDescription.trim() || !lessonVideoFile) {
                toast.error('Preencha titulo, descricao e selecione o video.');
                return;
              }
              createLesson.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.message ?? 'Erro ao adicionar aula.');
                },
                onSuccess: () => setCreateLessonModalOpen(false),
              });
            }}
          >
            Cadastrar aula
          </Button>
        </div>
      </Modal>

      <Modal title="Editar quiz" open={editModalType === 'quiz'} onClose={closeEditModal}>
        <div className="grid gap-4">
          <FormField id="edit-quiz-max-attempts" label="Maximo de tentativas">
            <Input
              id="edit-quiz-max-attempts"
              type="number"
              min={1}
              value={editingQuizMaxAttempts}
              onChange={(e) => setEditingQuizMaxAttempts(Number(e.target.value) || 1)}
            />
          </FormField>
          <Button
            loading={updateQuiz.isPending}
            disabled={updateQuiz.isPending}
            onClick={() => {
              if (!editingQuizId) {
                toast.error('Quiz invalido.');
                return;
              }
              if (editingQuizMaxAttempts < 1) {
                toast.error('Informe um maximo de tentativas valido.');
                return;
              }
              updateQuiz.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.response?.data?.message ?? 'Erro ao atualizar quiz.');
                },
              });
            }}
          >
            Salvar alteracoes
          </Button>
        </div>
      </Modal>

      <Modal title="Editar aula" open={editModalType === 'lesson'} onClose={closeEditModal}>
        <div className="grid gap-4">
          <FormField id="edit-lesson-title" label="Titulo da aula">
            <Input
              id="edit-lesson-title"
              value={editingLessonTitle}
              onChange={(e) => setEditingLessonTitle(e.target.value)}
            />
          </FormField>
          <FormField id="edit-lesson-description" label="Descricao">
            <Textarea
              id="edit-lesson-description"
              value={editingLessonDescription}
              onChange={(e) => setEditingLessonDescription(e.target.value)}
            />
          </FormField>
          <FormField id="edit-lesson-duration" label="Duracao em segundos (opcional)">
            <Input
              id="edit-lesson-duration"
              type="number"
              min={0}
              value={editingLessonDurationSeconds}
              onChange={(e) =>
                setEditingLessonDurationSeconds(e.target.value ? Number(e.target.value) : '')
              }
            />
          </FormField>
          <FormField id="edit-lesson-video-file" label="Substituir video (opcional)">
            <Input
              id="edit-lesson-video-file"
              type="file"
              accept="video/*"
              onChange={(e) => setEditingLessonVideoFile(e.target.files?.[0] ?? null)}
            />
          </FormField>
          <Button
            loading={updateLesson.isPending}
            disabled={updateLesson.isPending}
            onClick={() => {
              if (!editingLessonId) {
                toast.error('Aula invalida.');
                return;
              }
              if (!editingLessonTitle.trim() || !editingLessonDescription.trim()) {
                toast.error('Preencha titulo e descricao.');
                return;
              }
              updateLesson.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.response?.data?.message ?? error?.message ?? 'Erro ao atualizar aula.');
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
