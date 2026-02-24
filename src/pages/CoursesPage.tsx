import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

type ModalType = 'none' | 'course' | 'lesson';

export function CoursesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data,
  });

  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const [lessonOrder, setLessonOrder] = useState(1);
  const [lessonDurationSeconds, setLessonDurationSeconds] = useState<number | ''>('');

  function closeModal() {
    setModalType('none');
  }

  const createCourse = useMutation({
    mutationFn: async () => api.post('/courses', { title: courseTitle, description: courseDescription }),
    onSuccess: () => {
      setCourseTitle('');
      setCourseDescription('');
      closeModal();
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const createLesson = useMutation({
    mutationFn: async () => {
      if (!lessonVideoFile) {
        throw new Error('Selecione um video para upload.');
      }

      const { data: presign } = await api.post('/courses/videos/presign-upload', {
        courseId: selectedCourseId,
        fileName: lessonVideoFile.name,
        contentType: lessonVideoFile.type || 'video/mp4',
      });

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(presign.uploadUrl, {
          method: 'PUT',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Content-Type': lessonVideoFile.type || 'video/mp4',
          },
          body: lessonVideoFile,
        });
      } catch {
        throw new Error(
          'Falha de CORS ao enviar para S3. Configure o CORS da bucket para permitir PUT/GET/HEAD/OPTIONS do dominio do admin.',
        );
      }

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload do video para o S3.');
      }

      return api.post(`/courses/${selectedCourseId}/lessons`, {
        title: lessonTitle,
        description: lessonDescription,
        videoKey: presign.key,
        videoOriginalName: lessonVideoFile.name,
        videoMimeType: lessonVideoFile.type || 'video/mp4',
        order: lessonOrder,
        durationSeconds: lessonDurationSeconds === '' ? undefined : Number(lessonDurationSeconds),
      });
    },
    onSuccess: () => {
      setLessonTitle('');
      setLessonDescription('');
      setLessonVideoFile(null);
      setLessonOrder(1);
      setLessonDurationSeconds('');
      closeModal();
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Cursos e Aulas</h1>
        <Button onClick={() => setModalType('course')}>Adicionar curso</Button>
      </div>

      <Card>
        <h2>Lista</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {data?.map((course: any) => {
            const lessons = course.lessons ?? [];
            return (
              <div key={course.id} style={{ border: '1px solid var(--primary-soft)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <strong>{course.title}</strong>
                    <p>{course.description}</p>
                    <small>{lessons.length} aulas no curso</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setModalType('lesson');
                      }}
                    >
                      Adicionar aula
                    </Button>
                    <Button
                      onClick={() =>
                        navigate('/quizzes', {
                          state: {
                            openCreateQuiz: true,
                            courseId: course.id,
                            type: 'POST_COURSE',
                          },
                        })
                      }
                    >
                      Quiz final
                    </Button>
                  </div>
                </div>

                {!!lessons.length && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                    <strong>Aulas do curso</strong>
                    {lessons.map((lesson: any) => (
                      <div key={lesson.id} style={{ border: '1px solid var(--primary-soft)', borderRadius: 8, padding: 8 }}>
                        <strong>{lesson.title}</strong>
                        <p style={{ margin: '4px 0', color: 'var(--gray-1)' }}>
                          Ordem {lesson.order} {lesson.durationSeconds ? `| ${lesson.durationSeconds}s` : ''}
                        </p>
                        <small>{lesson.videoOriginalName ?? lesson.videoKey ?? 'Video enviado'}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Modal title="Adicionar curso" open={modalType === 'course'} onClose={closeModal}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Título do curso
            <input placeholder="Ex: Formação Inicial" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
          </label>
          <label>
            Descrição
            <textarea placeholder="Descreva o objetivo do curso" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} />
          </label>
          <Button
            loading={createCourse.isPending}
            disabled={createCourse.isPending}
            onClick={() => {
              if (!courseTitle.trim() || !courseDescription.trim()) {
                window.alert('Preencha título e descrição.');
                return;
              }
              createCourse.mutate();
            }}
          >
            Salvar curso
          </Button>
        </div>
      </Modal>

      <Modal title="Adicionar aula" open={modalType === 'lesson'} onClose={closeModal}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Título da aula
            <input placeholder="Ex: Assistindo aulas em vídeo" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
          </label>
          <label>
            Descrição
            <textarea placeholder="Descreva o conteúdo da aula" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} />
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
            <input type="number" min={1} placeholder="Ex: 1" value={lessonOrder} onChange={(e) => setLessonOrder(Number(e.target.value) || 1)} />
          </label>
          <label>
            Duração em segundos (opcional)
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
                window.alert('Preencha título, descrição e selecione o video.');
                return;
              }
              createLesson.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.message ?? 'Erro ao adicionar aula.');
                },
              });
            }}
          >
            Salvar aula
          </Button>
        </div>
      </Modal>
    </div>
  );
}
