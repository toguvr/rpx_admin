import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/States';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

export function TeachersPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => (await api.get('/users/teachers')).data,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [removingId, setRemovingId] = useState('');

  const create = useMutation({
    mutationFn: async () => api.post('/users/teachers', { name, email, password }),
    onSuccess: () => {
      setName('');
      setEmail('');
      setPassword('');
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor adicionado com sucesso.');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/teachers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor excluído com sucesso.');
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Professores"
        description="Gerencie acesso dos professores ao painel."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Adicionar professor
          </Button>
        }
      />

      <SectionCard title="Lista" description="Profissionais com acesso de professor.">
        {isLoading ? <LoadingState rows={4} /> : null}
        {isError ? <ErrorState message="Erro ao carregar professores." onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && !data?.length ? (
          <EmptyState title="Nenhum professor cadastrado" description="Adicione um professor para liberar acesso." />
        ) : null}

        <div className="grid gap-3">
          {data?.map((teacher: any) => (
            <div key={teacher.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="font-semibold">{teacher.name}</p>
                <p className="text-sm text-muted-foreground">{teacher.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Professor</Badge>
                <Button
                  variant="destructive"
                  aria-label="Excluir professor"
                  title="Excluir professor"
                  onClick={() => {
                    if (!window.confirm('Deseja excluir este professor?')) return;
                    setRemovingId(teacher.id);
                    remove.mutate(teacher.id, {
                      onSettled: () => setRemovingId(''),
                      onError: () => toast.error('Erro ao excluir professor.'),
                    });
                  }}
                  loading={remove.isPending && removingId === teacher.id}
                  disabled={remove.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal title="Adicionar professor" open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="grid gap-4">
          <FormField id="teacher-name" label="Nome">
            <Input id="teacher-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </FormField>
          <FormField id="teacher-email" label="E-mail">
            <Input id="teacher-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="professor@rpx.com" />
          </FormField>
          <FormField id="teacher-password" label="Senha">
            <Input
              id="teacher-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha inicial"
            />
          </FormField>
          <Button
            loading={create.isPending}
            disabled={create.isPending}
            onClick={() => {
              if (!name.trim() || !email.trim() || !password.trim()) {
                toast.error('Preencha nome, e-mail e senha.');
                return;
              }
              create.mutate();
            }}
          >
            Salvar professor
          </Button>
        </div>
      </Modal>
    </div>
  );
}
