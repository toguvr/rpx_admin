import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil, Plus, Upload, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
  const [studentFilterType, setStudentFilterType] = useState<'all' | 'name' | 'email' | 'group' | 'status'>('name');
  const [studentSearch, setStudentSearch] = useState('');
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    fileName: string;
    totalRows: number;
    validCount: number;
    invalidCount: number;
    rows: Array<{
      rowNumber: number;
      name: string;
      email: string;
      group: string;
      status: 'VALID' | 'INVALID' | 'SKIPPED';
      message: string;
    }>;
  } | null>(null);

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

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const source = students ?? [];

    if (!query) {
      return source;
    }

    return source.filter((student: any) => {
      const fields =
        studentFilterType === 'all'
          ? [
              student.name ?? '',
              student.email ?? '',
              student.group?.name ?? '',
              student.isActive ? 'ativo' : 'inativo',
            ]
          : [
              studentFilterType === 'name'
                ? student.name ?? ''
                : studentFilterType === 'email'
                  ? student.email ?? ''
                  : studentFilterType === 'group'
                    ? student.group?.name ?? ''
                    : student.isActive
                      ? 'ativo'
                      : 'inativo',
            ];

      return fields.some((value) => String(value).toLowerCase().includes(query));
    });
  }, [studentFilterType, studentSearch, students]);

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

  async function upload(rows: Array<{ rowNumber: number; name: string; email: string; group: string }>, fileName: string) {
    try {
      setUploading(true);
      const { data } = await api.post('/imports/students/register', {
        fileName,
        rows,
      });
      setResult(data);
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Importação concluída.');
    } finally {
      setUploading(false);
    }
  }

  function normalizeHeader(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '');
  }

  function cellToString(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  async function previewImport(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error('Arquivo sem planilha válida.');
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });

      const header = (rows[0] ?? []).map((item) => normalizeHeader(String(item ?? '')));
      const nameIndex = header.findIndex((item) => ['name', 'nome'].includes(item));
      const emailIndex = header.findIndex((item) => ['email', 'mail', 'emailaddress'].includes(item));
      const groupIndex = header.findIndex((item) => ['group', 'lote', 'grupo', 'batch', 'turma'].includes(item));

      if (nameIndex < 0 || emailIndex < 0) {
        throw new Error('Planilha deve conter colunas name e email.');
      }

      const parsedRows: Array<{
        rowNumber: number;
        name: string;
        email: string;
        group: string;
        status: 'VALID' | 'INVALID' | 'SKIPPED';
        message: string;
      }> = [];

      let validCount = 0;
      let invalidCount = 0;

      rows.slice(1).forEach((row, index) => {
        const rowNumber = index + 2;
        const name = cellToString(row[nameIndex] ?? '');
        const email = cellToString(row[emailIndex] ?? '').toLowerCase();
        const group = groupIndex >= 0 ? cellToString(row[groupIndex] ?? '') : '';

        if (!name && !email && !group) {
          parsedRows.push({
            rowNumber,
            name,
            email,
            group,
            status: 'SKIPPED',
            message: 'Linha vazia descartada.',
          });
          return;
        }

        if (!name || !email) {
          invalidCount += 1;
          parsedRows.push({
            rowNumber,
            name,
            email,
            group,
            status: 'INVALID',
            message: 'Nome ou e-mail ausente.',
          });
          return;
        }

        validCount += 1;
        parsedRows.push({
          rowNumber,
          name,
          email,
          group,
          status: 'VALID',
          message: 'Pronto para importação.',
        });
      });

      setPreview({
        fileName: file.name,
        totalRows: parsedRows.length,
        validCount,
        invalidCount,
        rows: parsedRows,
      });
      toast.success('Pré-visualização pronta.');
    } catch (error: any) {
      setPreview(null);
      toast.error(error?.message ?? 'Nao foi possivel ler a planilha.');
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

  async function downloadImportTemplate() {
    try {
      const response = await api.get('/imports/students/template', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template-importacao-alunos.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Nao foi possivel baixar o template.');
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        title="Alunos"
        description="Importação, lotes e gerenciamento de cadastros."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Button variant="secondary" onClick={() => setGroupModalOpen(true)} className="w-full sm:w-auto">
              <Users size={16} />
              Criar lote
            </Button>
            <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
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
            onChange={async (e) => {
              const file = e.target.files?.[0];
              setSelectedFile(file ?? null);
              setResult(null);
              if (file) {
                await previewImport(file);
              } else {
                setPreview(null);
              }
            }}
          />
          <Badge variant="outline">
            <Upload size={14} className="mr-1" />
            {uploading ? 'Enviando...' : 'Pronto para upload'}
          </Badge>
          <Button variant="secondary" onClick={downloadImportTemplate}>
            <Download size={16} />
            Baixar template
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Colunas obrigatórias: `name` e `email`. Opcional: `group`.
        </p>
      </SectionCard>

      {preview ? (
        <SectionCard
          title="Pré-visualização da planilha"
          description="Confira as linhas válidas antes de salvar."
          action={
            <Button
              onClick={() => {
                if (!selectedFile) {
                  toast.error('Selecione um arquivo .xlsx para importar.');
                  return;
                }
                const validRows = preview.rows
                  .filter((row) => row.status === 'VALID')
                  .map((row) => ({
                    rowNumber: row.rowNumber,
                    name: row.name,
                    email: row.email,
                    group: row.group,
                  }));
                upload(validRows, selectedFile.name);
              }}
              loading={uploading}
              disabled={!selectedFile || uploading || preview.validCount === 0}
              className="w-full sm:w-auto"
            >
              <Upload size={16} />
              Salvar linhas válidas
            </Button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border p-3">Linhas lidas: <strong>{preview.totalRows}</strong></div>
            <div className="rounded-lg border p-3">Válidas: <strong>{preview.validCount}</strong></div>
            <div className="rounded-lg border p-3">Inválidas: <strong>{preview.invalidCount}</strong></div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row) => (
                  <TableRow key={`${row.rowNumber}-${row.email}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{row.name || '-'}</TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.group || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === 'VALID'
                            ? 'secondary'
                            : row.status === 'SKIPPED'
                              ? 'outline'
                              : 'destructive'
                        }
                      >
                        {row.status === 'VALID' ? 'Válida' : row.status === 'SKIPPED' ? 'Descartada' : 'Inválida'}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      ) : null}

      {result ? (
        <SectionCard title="Relatório da importação" description="Resumo do processamento da planilha.">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border p-3">Criados: <strong>{result.createdCount}</strong></div>
            <div className="rounded-lg border p-3">Já existiam: <strong>{result.existingCount}</strong></div>
            <div className="rounded-lg border p-3">Falharam: <strong>{result.failedCount}</strong></div>
          </div>
          {result.rowLogs?.length ? (
            <div className="mt-4 overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rowLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.rowNumber}</TableCell>
                      <TableCell>{log.email ?? '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'CREATED'
                              ? 'secondary'
                              : log.status === 'FAILED'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Lotes" description="Grupos de alunos para organização.">
        {!groups?.length ? (
          <EmptyState title="Nenhum lote cadastrado" description="Crie um lote para facilitar o gerenciamento." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[560px] sm:min-w-[680px]">
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
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Lista de alunos"
        description="Cadastros atuais da base de alunos."
        action={
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <Select
              value={studentFilterType}
              onChange={(event) => setStudentFilterType(event.target.value as 'all' | 'name' | 'email' | 'group' | 'status')}
              className="w-full md:w-[170px]"
            >
              <option value="name">Filtrar por nome</option>
              <option value="email">Filtrar por e-mail</option>
              <option value="group">Filtrar por lote</option>
              <option value="status">Filtrar por status</option>
              <option value="all">Buscar em tudo</option>
            </Select>
            <Input
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Digite para buscar aluno"
              className="w-full md:w-[280px]"
            />
          </div>
        }
      >
        {!students?.length ? (
          <EmptyState title="Nenhum aluno cadastrado" description="Adicione manualmente ou importe uma planilha." />
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}
            </div>
            <div className="overflow-x-auto">
            <Table className="min-w-[760px] sm:min-w-[920px]">
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
                {filteredStudents.map((student: any) => (
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
            </div>
            {!filteredStudents.length ? (
              <EmptyState
                title="Nenhum aluno encontrado"
                description="Ajuste o tipo de filtro ou refine o termo buscado."
              />
            ) : null}
          </div>
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
