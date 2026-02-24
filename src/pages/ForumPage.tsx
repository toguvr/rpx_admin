import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export function ForumPage() {
  const qc = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);

  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerQuestionId, setAnswerQuestionId] = useState('');
  const [answerBody, setAnswerBody] = useState('');
  const [solvingId, setSolvingId] = useState('');

  const { data } = useQuery({
    queryKey: ['forum'],
    queryFn: async () => (await api.get('/forum')).data,
  });

  const solve = useMutation({
    mutationFn: async (questionId: string) => api.patch(`/forum/${questionId}/solve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum'] }),
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, body }: { questionId: string; body: string }) =>
      api.post(`/forum/${questionId}/answers`, { body }),
    onSuccess: () => {
      setAnswerBody('');
      setAnswerQuestionId('');
      setAnswerModalOpen(false);
      qc.invalidateQueries({ queryKey: ['forum'] });
    },
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1>Forum</h1>
      {data?.map((q: any) => (
        <Card key={q.id}>
          <strong>{q.title}</strong>
          <p>{q.body}</p>
          <p>Status: {q.status === 'SOLVED' ? 'Solucionada' : 'Aberta'}</p>

          {Array.isArray(q.answers) && q.answers.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginTop: 10, marginBottom: 12 }}>
              <strong>Respostas</strong>
              {q.answers.map((ans: any) => (
                <div
                  key={ans.id}
                  style={{ border: '1px solid var(--primary-soft)', borderRadius: 10, padding: 10 }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>{ans.user?.name ?? 'Usuario'}</strong>
                    {ans.user?.role === 'PROFESSOR' && (
                      <span
                        style={{
                          background: 'var(--primary-soft)',
                          color: 'var(--primary-pressed)',
                          borderRadius: 8,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Professor
                      </span>
                    )}
                    {ans.isAi && (
                      <span
                        style={{
                          background: '#efe7ff',
                          color: '#5a3fa6',
                          borderRadius: 8,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        IA
                      </span>
                    )}
                  </div>
                  <p style={{ marginBottom: 0 }}>{ans.body}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(role === 'PROFESSOR' || role === 'ADMIN') && (
              <Button
                onClick={() => {
                  setAnswerQuestionId(q.id);
                  setAnswerModalOpen(true);
                }}
              >
                Adicionar resposta
              </Button>
            )}
            <Button
              loading={solve.isPending && solvingId === q.id}
              disabled={solve.isPending}
              onClick={() => {
                setSolvingId(q.id);
                solve.mutate(q.id, {
                  onSettled: () => setSolvingId(''),
                });
              }}
            >
              Marcar solucionada
            </Button>
          </div>
        </Card>
      ))}

      <Modal
        title="Adicionar resposta"
        open={answerModalOpen}
        onClose={() => setAnswerModalOpen(false)}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Resposta
            <textarea
              placeholder="Digite a resposta para a dúvida"
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              style={{ minHeight: 110 }}
            />
          </label>
          <Button
            loading={answerMutation.isPending}
            disabled={answerMutation.isPending}
            onClick={() => {
              if (!answerBody.trim() || !answerQuestionId) {
                window.alert('Escreva a resposta antes de salvar.');
                return;
              }
              answerMutation.mutate({ questionId: answerQuestionId, body: answerBody.trim() });
            }}
          >
            Salvar resposta
          </Button>
        </div>
      </Modal>
    </div>
  );
}
