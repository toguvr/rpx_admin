import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

type ModalType = 'none' | 'create-course' | 'edit-course';

export function CoursesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data,
  });

  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  function closeModal() {
    setModalType('none');
    setSelectedCourseId('');
    setCourseTitle('');
    setCourseDescription('');
  }

  function openCreateModal() {
    setModalType('create-course');
  }

  function openEditModal(course: any) {
    setSelectedCourseId(course.id);
    setCourseTitle(course.title ?? '');
    setCourseDescription(course.description ?? '');
    setModalType('edit-course');
  }

  const createCourse = useMutation({
    mutationFn: async () => api.post('/courses', { title: courseTitle, description: courseDescription }),
    onSuccess: () => {
      closeModal();
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async () => api.put(`/courses/${selectedCourseId}`, { title: courseTitle, description: courseDescription }),
    onSuccess: () => {
      closeModal();
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Cursos</h1>
        <Button onClick={openCreateModal}>Adicionar curso</Button>
      </div>

      <Card>
        <h2>Lista</h2>
        {isLoading && <p>Carregando cursos...</p>}
        {!isLoading && !data?.length && <p>Nenhum curso cadastrado.</p>}
        <div style={{ display: 'grid', gap: 10 }}>
          {data?.map((course: any) => (
            <div key={course.id} style={{ border: '1px solid var(--primary-soft)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <strong>{course.title}</strong>
                  <p style={{ margin: '6px 0', color: 'var(--gray-1)' }}>{course.description}</p>
                  <small>
                    {(course.lessons ?? []).length} aulas | {(course.quizzes ?? []).length} quizzes
                  </small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button onClick={() => navigate(`/courses/${course.id}`)}>Abrir curso</Button>
                  <Button style={{ background: 'var(--gray-1)' }} onClick={() => openEditModal(course)}>
                    Editar
                  </Button>
                  <Button
                    style={{ background: 'var(--error)' }}
                    loading={deleteCourse.isPending}
                    disabled={deleteCourse.isPending}
                    onClick={() => {
                      if (!window.confirm(`Deseja realmente excluir o curso "${course.title}"?`)) {
                        return;
                      }
                      deleteCourse.mutate(course.id, {
                        onError: (error: any) => {
                          window.alert(error?.response?.data?.message ?? 'Erro ao excluir curso.');
                        },
                      });
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal title={modalType === 'edit-course' ? 'Editar curso' : 'Adicionar curso'} open={modalType !== 'none'} onClose={closeModal}>
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
            loading={createCourse.isPending || updateCourse.isPending}
            disabled={createCourse.isPending || updateCourse.isPending}
            onClick={() => {
              if (!courseTitle.trim() || !courseDescription.trim()) {
                window.alert('Preencha título e descrição.');
                return;
              }
              if (modalType === 'edit-course') {
                updateCourse.mutate(undefined, {
                  onError: (error: any) => {
                    window.alert(error?.response?.data?.message ?? 'Erro ao atualizar curso.');
                  },
                });
                return;
              }

              createCourse.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.response?.data?.message ?? 'Erro ao criar curso.');
                },
              });
            }}
          >
            {modalType === 'edit-course' ? 'Salvar alteracoes' : 'Salvar curso'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
