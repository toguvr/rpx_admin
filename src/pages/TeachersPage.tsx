import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

export function TeachersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
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
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/teachers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Professores</h1>
        <Button onClick={() => setModalOpen(true)}>Adicionar professor</Button>
      </div>

      <Card>
        <h2>Lista</h2>
        {data?.map((teacher: any) => (
          <div
            key={teacher.id}
            style={{
              border: '1px solid var(--primary-soft)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <strong>{teacher.name}</strong>
            <p>{teacher.email}</p>
            <Button
              style={{ background: 'var(--error)' }}
              onClick={() => {
                if (!window.confirm('Deseja excluir este professor?')) return;
                setRemovingId(teacher.id);
                remove.mutate(teacher.id, {
                  onSettled: () => setRemovingId(''),
                });
              }}
              loading={remove.isPending && removingId === teacher.id}
              disabled={remove.isPending}
            >
              Excluir
            </Button>
          </div>
        ))}
      </Card>

      <Modal title="Adicionar professor" open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </label>
          <label>
            E-mail
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="professor@rpx.com" />
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
            Salvar professor
          </Button>
        </div>
      </Modal>
    </div>
  );
}
