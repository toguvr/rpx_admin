import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

export function PsychologistsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
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
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/psychologists/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['psychologists'] }),
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Psicólogos</h1>
        <Button onClick={() => setModalOpen(true)}>Adicionar psicólogo</Button>
      </div>

      <Card>
        <h2>Lista</h2>
        {data?.map((psychologist: any) => (
          <div
            key={psychologist.id}
            style={{
              border: '1px solid var(--primary-soft)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <strong>{psychologist.name}</strong>
            <p>{psychologist.email}</p>
            <Button
              style={{ background: 'var(--error)' }}
              onClick={() => {
                if (!window.confirm('Deseja excluir este psicólogo?')) return;
                setRemovingId(psychologist.id);
                remove.mutate(psychologist.id, {
                  onSettled: () => setRemovingId(''),
                });
              }}
              loading={remove.isPending && removingId === psychologist.id}
              disabled={remove.isPending}
            >
              Excluir
            </Button>
          </div>
        ))}
      </Card>

      <Modal title="Adicionar psicólogo" open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </label>
          <label>
            E-mail
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="psicologo@rpx.com" />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha inicial"
            />
          </label>
          <Button
            loading={create.isPending}
            disabled={create.isPending}
            onClick={() => {
              if (!name.trim() || !email.trim() || !password.trim()) {
                window.alert('Preencha nome, e-mail e senha.');
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
