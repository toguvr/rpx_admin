import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
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
  const [draggingLessonId, setDraggingLessonId] = useState('');

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
      window.alert('Aula cadastrada com sucesso.');
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

  const reorderLessons = useMutation({
    mutationFn: async (lessonIds: string[]) =>
      api.patch(`/courses/${courseId}/lessons/reorder`, { lessonIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const reorderQuizzes = useMutation({
    mutationFn: async (quizIds: string[]) =>
      api.patch('/quizzes/reorder', { courseId, quizIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
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

  const lessons = [...(course.lessons ?? [])].sort((a: any, b: any) => a.order - b.order);
  const quizzes = [...(course.quizzes ?? [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

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
          <button
            type="button"
            aria-label="Adicionar quiz"
            title="Adicionar quiz"
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
            <Icon name="plus" size={18} />
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
                  <tr
                    key={quiz.id}
                    draggable
                    onDragStart={() => setDraggingQuizId(quiz.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingQuizId || draggingQuizId === quiz.id) return;
                      const next = reorderList(quizzes, draggingQuizId, quiz.id);
                      reorderQuizzes.mutate(next.map((item: any) => item.id), {
                        onError: (error: any) => {
                          window.alert(error?.response?.data?.message ?? 'Erro ao reordenar quizzes.');
                        },
                      });
                      setDraggingQuizId('');
                    }}
                    style={{ borderTop: '1px solid var(--primary-soft)', cursor: 'grab' }}
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
                                window.alert(error?.response?.data?.message ?? 'Erro ao excluir quiz.');
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
          <button
            type="button"
            aria-label="Adicionar aula"
            title="Adicionar aula"
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
            <Icon name="plus" size={18} />
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
                  <tr
                    key={lesson.id}
                    draggable
                    onDragStart={() => setDraggingLessonId(lesson.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingLessonId || draggingLessonId === lesson.id) return;
                      const next = reorderList(lessons, draggingLessonId, lesson.id);
                      reorderLessons.mutate(next.map((item: any) => item.id), {
                        onError: (error: any) => {
                          window.alert(error?.response?.data?.message ?? 'Erro ao reordenar aulas.');
                        },
                      });
                      setDraggingLessonId('');
                    }}
                    style={{ borderTop: '1px solid var(--primary-soft)', cursor: 'grab' }}
                  >
                    <td style={{ padding: '8px 0' }}>{lesson.title}</td>
                    <td>{lesson.order}</td>
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
                                window.alert(error?.response?.data?.message ?? 'Erro ao excluir aula.');
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
