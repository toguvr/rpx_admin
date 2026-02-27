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

export function PsychologistsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['psychologists'],
    queryFn: async () => (await api.get('/users/psychologists')).data,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [removingId, setRemovingId] = useState('');

  const create = useMutation({
    mutationFn: async () => api.post('/users/psychologists', { name, email, password }),
    onSuccess: () => {
      setName('');
      setEmail('');
      setPassword('');
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ['psychologists'] });
      toast.success('Psicólogo adicionado com sucesso.');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/psychologists/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['psychologists'] });
      toast.success('Psicólogo excluído com sucesso.');
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Psicólogos"
        description="Gerencie o time de atendimento psicológico."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Adicionar psicólogo
          </Button>
        }
      />

      <SectionCard title="Lista" description="Profissionais vinculados ao suporte.">
        {isLoading ? <LoadingState rows={4} /> : null}
        {isError ? <ErrorState message="Erro ao carregar psicólogos." onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && !data?.length ? (
          <EmptyState title="Nenhum psicólogo cadastrado" description="Adicione um psicólogo para habilitar atendimentos." />
        ) : null}

        <div className="grid gap-3">
          {data?.map((psychologist: any) => (
            <div key={psychologist.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="font-semibold">{psychologist.name}</p>
                <p className="text-sm text-muted-foreground">{psychologist.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Psicólogo</Badge>
                <Button
                  variant="destructive"
                  aria-label="Excluir psicólogo"
                  title="Excluir psicólogo"
                  onClick={() => {
                    if (!window.confirm('Deseja excluir este psicólogo?')) return;
                    setRemovingId(psychologist.id);
                    remove.mutate(psychologist.id, {
                      onSettled: () => setRemovingId(''),
                      onError: () => toast.error('Erro ao excluir psicólogo.'),
                    });
                  }}
                  loading={remove.isPending && removingId === psychologist.id}
                  disabled={remove.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal title="Adicionar psicólogo" open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="grid gap-4">
          <FormField id="psychologist-name" label="Nome">
            <Input id="psychologist-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </FormField>
          <FormField id="psychologist-email" label="E-mail">
            <Input id="psychologist-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="psicologo@rpx.com" />
          </FormField>
          <FormField id="psychologist-password" label="Senha">
            <Input
              id="psychologist-password"
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
            Salvar psicólogo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
