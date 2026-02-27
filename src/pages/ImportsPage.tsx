import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Upload, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState } from '@/components/shared/States';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      toast.success('Aluno criado com sucesso.');
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
      toast.success('Aluno atualizado com sucesso.');
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno removido.');
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
      toast.success('Lote criado com sucesso.');
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
      toast.success('Importação concluída.');
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
    <div className="grid gap-6">
      <PageHeader
        title="Alunos"
        description="Importação, lotes e gerenciamento de cadastros."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setGroupModalOpen(true)}>
              <Users size={16} />
              Criar lote
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <UserPlus size={16} />
              Adicionar aluno
            </Button>
          </div>
        }
      />

      <SectionCard title="Importar planilha" description="Upload de arquivo .xlsx com alunos.">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="file"
            accept=".xlsx"
            disabled={uploading}
            className="max-w-md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <Badge variant="outline">
            <Upload size={14} className="mr-1" />
            {uploading ? 'Enviando...' : 'Pronto para upload'}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Colunas obrigatórias: `name` e `email`. Opcional: `lote/grupo`.</p>
      </SectionCard>

      {result ? (
        <SectionCard title="Relatório da importação" description="Resumo do processamento da planilha.">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border p-3">Criados: <strong>{result.createdCount}</strong></div>
            <div className="rounded-lg border p-3">Já existiam: <strong>{result.existingCount}</strong></div>
            <div className="rounded-lg border p-3">Falharam: <strong>{result.failedCount}</strong></div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Lotes" description="Grupos de alunos para organização.">
        {!groups?.length ? (
          <EmptyState title="Nenhum lote cadastrado" description="Crie um lote para facilitar o gerenciamento." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group: any) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group._count?.users ?? 0}</TableCell>
                  <TableCell>{group.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell>
                    <Button
                      variant={group.isActive ? 'destructive' : 'default'}
                      loading={toggleGroupStatus.isPending}
                      disabled={toggleGroupStatus.isPending}
                      onClick={() =>
                        toggleGroupStatus.mutate(
                          { id: group.id, isActive: !group.isActive },
                          {
                            onError: (error: any) => {
                              toast.error(error?.response?.data?.message ?? 'Erro ao atualizar status do lote.');
                            },
                          },
                        )
                      }
                    >
                      {group.isActive ? 'Desativar lote' : 'Ativar lote'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard title="Lista de alunos" description="Cadastros atuais da base de alunos.">
        {!students?.length ? (
          <EmptyState title="Nenhum aluno cadastrado" description="Adicione manualmente ou importe uma planilha." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(students ?? []).map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.group?.name ?? 'Sem lote'}</TableCell>
                  <TableCell>{student.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" aria-label="Editar aluno" title="Editar aluno" onClick={() => openEditStudent(student)}>
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant={student.isActive ? 'destructive' : 'default'}
                        loading={toggleStudentStatus.isPending}
                        disabled={toggleStudentStatus.isPending}
                        onClick={() =>
                          toggleStudentStatus.mutate(
                            { id: student.id, isActive: !student.isActive },
                            {
                              onError: (error: any) => {
                                toast.error(error?.response?.data?.message ?? 'Erro ao atualizar status do aluno.');
                              },
                            },
                          )
                        }
                      >
                        {student.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        loading={deleteStudent.isPending}
                        disabled={deleteStudent.isPending}
                        aria-label="Excluir aluno"
                        title="Excluir aluno"
                        onClick={() => {
                          if (!window.confirm(`Deseja excluir o aluno "${student.name}"?`)) return;
                          deleteStudent.mutate(student.id, {
                            onError: (error: any) => {
                              toast.error(error?.response?.data?.message ?? 'Erro ao excluir aluno.');
                            },
                          });
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <Modal title="Adicionar aluno" open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="grid gap-4">
          <FormField id="student-name" label="Nome">
            <Input id="student-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </FormField>
          <FormField id="student-email" label="E-mail">
            <Input id="student-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@rpx.com" />
          </FormField>
          <FormField id="student-password" label="Senha inicial">
            <Input
              id="student-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
            />
          </FormField>
          <FormField id="student-group" label="Lote (opcional)">
            <Select id="student-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Sem lote</option>
              {(groups ?? []).map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </FormField>
          <Button variant="secondary" onClick={() => setGroupModalOpen(true)}>
            <Plus size={16} />
            Criar novo lote
          </Button>
          <Button
            loading={createStudent.isPending}
            disabled={createStudent.isPending}
            onClick={() => {
              if (!name.trim() || !email.trim() || !password.trim()) {
                toast.error('Preencha nome, e-mail e senha.');
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
        <div className="grid gap-4">
          <FormField id="edit-student-name" label="Nome">
            <Input id="edit-student-name" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
          </FormField>
          <FormField id="edit-student-email" label="E-mail">
            <Input id="edit-student-email" value={editingEmail} onChange={(e) => setEditingEmail(e.target.value)} />
          </FormField>
          <FormField id="edit-student-group" label="Lote">
            <Select id="edit-student-group" value={editingGroupId} onChange={(e) => setEditingGroupId(e.target.value)}>
              <option value="">Sem lote</option>
              {(groups ?? []).map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="edit-student-status" label="Status">
            <Select
              id="edit-student-status"
              value={editingIsActive ? 'true' : 'false'}
              onChange={(e) => setEditingIsActive(e.target.value === 'true')}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </FormField>
          <Button
            loading={updateStudent.isPending}
            disabled={updateStudent.isPending}
            onClick={() => {
              if (!editingStudentId) {
                toast.error('Aluno invalido.');
                return;
              }
              if (!editingName.trim() || !editingEmail.trim()) {
                toast.error('Preencha nome e e-mail.');
                return;
              }
              updateStudent.mutate(undefined, {
                onError: (error: any) => {
                  toast.error(error?.response?.data?.message ?? 'Erro ao editar aluno.');
                },
              });
            }}
          >
            Salvar alterações
          </Button>
        </div>
      </Modal>

      <Modal title="Criar lote" open={groupModalOpen} onClose={() => setGroupModalOpen(false)}>
        <div className="grid gap-4">
          <FormField id="group-name" label="Nome do lote">
            <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: Volta Redonda" />
          </FormField>
          <Button
            loading={createGroup.isPending}
            disabled={createGroup.isPending}
            onClick={() => {
              if (!groupName.trim()) {
                toast.error('Digite o nome do lote.');
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
