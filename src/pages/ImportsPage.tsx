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
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editingStudentId, setEditingStudentId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingGroupId, setEditingGroupId] = useState('');
  const [editingIsActive, setEditingIsActive] = useState(true);

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

  const updateStudent = useMutation({
    mutationFn: async () =>
      api.put(`/users/students/${editingStudentId}`, {
        name: editingName,
        email: editingEmail,
        groupId: editingGroupId || null,
        isActive: editingIsActive,
      }),
    onSuccess: () => {
      setEditModalOpen(false);
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const toggleStudentStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}/status`, { isActive }),
    onSuccess: () => {
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

  const toggleGroupStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/groups/${id}/status`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['students'] });
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
      qc.invalidateQueries({ queryKey: ['groups'] });
    } finally {
      setUploading(false);
    }
  }

  function openEditStudent(student: any) {
    setEditingStudentId(student.id);
    setEditingName(student.name ?? '');
    setEditingEmail(student.email ?? '');
    setEditingGroupId(student.group?.id ?? '');
    setEditingIsActive(Boolean(student.isActive));
    setEditModalOpen(true);
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Alunos</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
        <p>Colunas obrigatorias: name e email. Opcional: lote/grupo.</p>
      </Card>

      {result && (
        <Card>
          <h2>Relatorio da importacao</h2>
          <p>Criados: {result.createdCount}</p>
          <p>Ja existiam: {result.existingCount}</p>
          <p>Falharam: {result.failedCount}</p>
        </Card>
      )}

      <Card>
        <h2>Lotes</h2>
        {!groups?.length && <p>Nenhum lote cadastrado.</p>}
        {!!groups?.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Lote</th>
                  <th align="left">Alunos</th>
                  <th align="left">Status</th>
                  <th align="left">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group: any) => (
                  <tr key={group.id} style={{ borderTop: '1px solid var(--primary-soft)' }}>
                    <td style={{ padding: '8px 0' }}>{group.name}</td>
                    <td>{group._count?.users ?? 0}</td>
                    <td>{group.isActive ? 'Ativo' : 'Inativo'}</td>
                    <td style={{ padding: '8px 0' }}>
                      <Button
                        style={{ background: group.isActive ? 'var(--error)' : 'var(--success)' }}
                        loading={toggleGroupStatus.isPending}
                        disabled={toggleGroupStatus.isPending}
                        onClick={() =>
                          toggleGroupStatus.mutate(
                            { id: group.id, isActive: !group.isActive },
                            {
                              onError: (error: any) => {
                                window.alert(error?.response?.data?.message ?? 'Erro ao atualizar status do lote.');
                              },
                            },
                          )
                        }
                      >
                        {group.isActive ? 'Desativar lote' : 'Ativar lote'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2>Lista de alunos</h2>
        {!students?.length && <p>Nenhum aluno cadastrado.</p>}
        {!!students?.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Nome</th>
                  <th align="left">E-mail</th>
                  <th align="left">Lote</th>
                  <th align="left">Status</th>
                  <th align="left">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {(students ?? []).map((student: any) => (
                  <tr key={student.id} style={{ borderTop: '1px solid var(--primary-soft)' }}>
                    <td style={{ padding: '8px 0' }}>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.group?.name ?? 'Sem lote'}</td>
                    <td>{student.isActive ? 'Ativo' : 'Inativo'}</td>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button style={{ background: 'var(--gray-1)' }} onClick={() => openEditStudent(student)}>
                          Editar
                        </Button>
                        <Button
                          style={{ background: student.isActive ? 'var(--error)' : 'var(--success)' }}
                          loading={toggleStudentStatus.isPending}
                          disabled={toggleStudentStatus.isPending}
                          onClick={() =>
                            toggleStudentStatus.mutate(
                              { id: student.id, isActive: !student.isActive },
                              {
                                onError: (error: any) => {
                                  window.alert(error?.response?.data?.message ?? 'Erro ao atualizar status do aluno.');
                                },
                              },
                            )
                          }
                        >
                          {student.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          style={{ background: 'var(--error)' }}
                          loading={deleteStudent.isPending}
                          disabled={deleteStudent.isPending}
                          onClick={() => {
                            if (!window.confirm(`Deseja excluir o aluno "${student.name}"?`)) return;
                            deleteStudent.mutate(student.id, {
                              onError: (error: any) => {
                                window.alert(error?.response?.data?.message ?? 'Erro ao excluir aluno.');
                              },
                            });
                          }}
                        >
                          Excluir
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
              placeholder="Minimo 8 caracteres"
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

      <Modal title="Editar aluno" open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Nome
            <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
          </label>
          <label>
            E-mail
            <input value={editingEmail} onChange={(e) => setEditingEmail(e.target.value)} />
          </label>
          <label>
            Lote
            <select value={editingGroupId} onChange={(e) => setEditingGroupId(e.target.value)}>
              <option value="">Sem lote</option>
              {(groups ?? []).map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={editingIsActive ? 'true' : 'false'} onChange={(e) => setEditingIsActive(e.target.value === 'true')}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <Button
            loading={updateStudent.isPending}
            disabled={updateStudent.isPending}
            onClick={() => {
              if (!editingStudentId) {
                window.alert('Aluno invalido.');
                return;
              }
              if (!editingName.trim() || !editingEmail.trim()) {
                window.alert('Preencha nome e e-mail.');
                return;
              }
              updateStudent.mutate(undefined, {
                onError: (error: any) => {
                  window.alert(error?.response?.data?.message ?? 'Erro ao editar aluno.');
                },
              });
            }}
          >
            Salvar alteracoes
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
