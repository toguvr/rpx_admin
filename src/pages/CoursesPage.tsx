import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/States';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';

type ModalType = 'none' | 'create-course' | 'edit-course';

export function CoursesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data,
  });

  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [draggingCourseId, setDraggingCourseId] = useState('');
  const [dragOverCourseId, setDragOverCourseId] = useState('');
  const [orderedCourses, setOrderedCourses] = useState<any[]>([]);

  useEffect(() => {
    setOrderedCourses([...(data ?? [])]);
  }, [data]);

  const filteredData = useMemo(
    () =>
      orderedCourses.filter((course: any) =>
        `${course.title ?? ''} ${course.description ?? ''}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [orderedCourses, search],
  );

  function reorderList<T extends { id: string }>(items: T[], fromId: string, toId: string) {
    const from = items.findIndex((item) => item.id === fromId);
    const to = items.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0 || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

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
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['courses'] });
      closeModal();
      toast.success('Curso criado com sucesso.');
    },
  });

  const updateCourse = useMutation({
    mutationFn: async () => api.put(`/courses/${selectedCourseId}`, { title: courseTitle, description: courseDescription }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['courses'] });
      closeModal();
      toast.success('Curso atualizado com sucesso.');
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso excluído com sucesso.');
    },
  });

  const reorderCourses = useMutation({
    mutationFn: async (courseIds: string[]) => api.patch('/courses/reorder', { courseIds }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Ordem dos cursos atualizada.');
    },
  });

  const isSavingCourse = modalType !== 'none' && (createCourse.isPending || updateCourse.isPending);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos e acompanhe o conteúdo publicado."
        actions={
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Adicionar curso
          </Button>
        }
      />

      <SectionCard title="Lista de cursos" description="Busca rápida por título e descrição.">
        {isFetching && !isLoading ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Atualizando lista de cursos...
          </div>
        ) : null}

        <div className="mb-4 max-w-sm">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar curso..." />
        </div>

        {isLoading ? <LoadingState rows={4} /> : null}
        {isError ? <ErrorState message="Erro ao carregar cursos." onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && !filteredData.length ? (
          <EmptyState title="Nenhum curso encontrado" description="Cadastre um novo curso para começar." />
        ) : null}

        <div className="grid gap-3">
          {filteredData.map((course: any) => (
            <div
              key={course.id}
              className="rounded-lg border bg-card/60 p-4"
              draggable
              onDragStart={() => setDraggingCourseId(course.id)}
              onDragEnter={() => {
                if (!draggingCourseId || draggingCourseId === course.id || reorderCourses.isPending) return;
                setDragOverCourseId(course.id);
                setOrderedCourses((prev) => reorderList(prev, draggingCourseId, course.id));
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => {
                if (dragOverCourseId === course.id) {
                  setDragOverCourseId('');
                }
              }}
              onDragEnd={() => {
                if (!draggingCourseId || reorderCourses.isPending) return;
                const nextIds = orderedCourses.map((item) => item.id);
                setDraggingCourseId('');
                setDragOverCourseId('');
                reorderCourses.mutate(nextIds, {
                  onError: async (error: any) => {
                    await qc.invalidateQueries({ queryKey: ['courses'] });
                    toast.error(error?.response?.data?.message ?? 'Erro ao reordenar cursos.');
                  },
                });
              }}
              style={{
                background: dragOverCourseId === course.id ? 'var(--primary-soft)' : undefined,
                boxShadow:
                  dragOverCourseId === course.id ? 'inset 0 0 0 1px var(--primary)' : undefined,
                cursor: reorderCourses.isPending ? 'progress' : 'grab',
                opacity: draggingCourseId === course.id ? 0.7 : 1,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <strong className="text-base">{course.title}</strong>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Ordem {course.order}</Badge>
                    <Badge variant="outline">{(course.lessons ?? []).length} aulas</Badge>
                    <Badge variant="outline">{(course.quizzes ?? []).length} quizzes</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate(`/courses/${course.id}`)}>Abrir curso</Button>
                  <Button variant="secondary" aria-label="Editar curso" title="Editar curso" onClick={() => openEditModal(course)}>
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    variant="destructive"
                    loading={deleteCourse.isPending}
                    disabled={deleteCourse.isPending}
                    aria-label="Excluir curso"
                    title="Excluir curso"
                    onClick={() => {
                      if (!window.confirm(`Deseja realmente excluir o curso "${course.title}"?`)) {
                        return;
                      }
                      deleteCourse.mutate(course.id, {
                        onError: (error: any) => {
                          toast.error(error?.response?.data?.message ?? 'Erro ao excluir curso.');
                        },
                      });
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal title={modalType === 'edit-course' ? 'Editar curso' : 'Adicionar curso'} open={modalType !== 'none'} onClose={closeModal}>
        <div className="grid gap-4">
          <FormField id="course-title" label="Título do curso">
            <Input id="course-title" placeholder="Ex: Formação Inicial" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
          </FormField>

          <FormField id="course-description" label="Descrição">
            <Textarea id="course-description" placeholder="Descreva o objetivo do curso" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} />
          </FormField>

          <Button
            loading={isSavingCourse}
            disabled={isSavingCourse}
            onClick={() => {
              if (!courseTitle.trim() || !courseDescription.trim()) {
                toast.error('Preencha título e descrição.');
                return;
              }
              if (modalType === 'edit-course') {
                updateCourse.mutate(undefined, {
                  onError: (error: any) => {
                    toast.error(error?.response?.data?.message ?? 'Erro ao atualizar curso.');
                  },
                });
                return;
              }

              createCourse.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.response?.data?.message ?? 'Erro ao criar curso.');
                },
              });
            }}
          >
            {modalType === 'edit-course' ? 'Salvar alterações' : 'Salvar curso'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
