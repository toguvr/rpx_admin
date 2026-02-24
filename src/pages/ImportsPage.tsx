import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

export function ImportsPage() {
  const qc = useQueryClient();
  const [result, setResult] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get('/users/students')).data,
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get('/users/groups')).data,
  });

  const createStudent = useMutation({
    mutationFn: async () =>
      api.post('/users/students', {
        name,
        email,
        password,
        groupId: groupId || null,
      }),
    onSuccess: () => {
      setName('');
      setEmail('');
      setPassword('');
      setGroupId('');
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const createGroup = useMutation({
    mutationFn: async () => api.post('/users/groups', { name: groupName }),
    onSuccess: (response) => {
      setGroupName('');
      setGroupModalOpen(false);
      qc.invalidateQueries({ queryKey: ['groups'] });
      if (response?.data?.id) {
        setGroupId(response.data.id);
      }
    },
  });

  async function upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const { data } = await api.post('/imports/students', formData);
      setResult(data);
      qc.invalidateQueries({ queryKey: ['students'] });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Alunos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button style={{ background: 'var(--gray-1)' }} onClick={() => setGroupModalOpen(true)}>
            Criar lote
          </Button>
          <Button onClick={() => setModalOpen(true)}>Adicionar aluno manualmente</Button>
        </div>
      </div>

      <Card>
        <h2>Importar planilha</h2>
        <input
          type="file"
          accept=".xlsx"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        {uploading ? <p style={{ margin: '8px 0 0 0', color: 'var(--primary-pressed)' }}>Enviando planilha...</p> : null}
        <p>Colunas obrigatórias: name e email. Opcional: lote/grupo.</p>
      </Card>

      {result && (
        <Card>
          <h2>Relatório da importação</h2>
          <p>Criados: {result.createdCount}</p>
          <p>Já existiam: {result.existingCount}</p>
          <p>Falharam: {result.failedCount}</p>
        </Card>
      )}

      <Card>
        <h2>Lista de alunos</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {(students ?? []).map((student: any) => (
            <div
              key={student.id}
              style={{
                border: '1px solid var(--primary-soft)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <strong>{student.name}</strong>
              <p style={{ margin: '6px 0' }}>{student.email}</p>
              <small>
                Lote: {student.group?.name ?? 'Sem lote'} | Status:{' '}
                {student.isActive ? 'Ativo' : 'Inativo'}
              </small>
            </div>
          ))}
        </div>
      </Card>

      <Modal title="Adicionar aluno" open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </label>
          <label>
            E-mail
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@rpx.com" />
          </label>
          <label>
            Senha inicial
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label>
            Lote (opcional)
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Sem lote</option>
              {(groups ?? []).map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <Button style={{ background: 'var(--gray-1)' }} onClick={() => setGroupModalOpen(true)}>
            Criar novo lote
          </Button>
          <Button
            loading={createStudent.isPending}
            disabled={createStudent.isPending}
            onClick={() => {
              if (!name.trim() || !email.trim() || !password.trim()) {
                window.alert('Preencha nome, e-mail e senha.');
                return;
              }
              createStudent.mutate();
            }}
          >
            Salvar aluno
          </Button>
        </div>
      </Modal>

      <Modal title="Criar lote" open={groupModalOpen} onClose={() => setGroupModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Nome do lote
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Volta Redonda"
            />
          </label>
          <Button
            loading={createGroup.isPending}
            disabled={createGroup.isPending}
            onClick={() => {
              if (!groupName.trim()) {
                window.alert('Digite o nome do lote.');
                return;
              }
              createGroup.mutate();
            }}
          >
            Salvar lote
          </Button>
        </div>
      </Modal>
    </div>
  );
}
