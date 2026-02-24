import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/Card';
import { api } from '@/services/api';

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
  });

  const cards = [
    { label: 'Alunos ativos', value: data?.activeStudents ?? 0 },
    { label: 'Aulas assistidas', value: data?.watchedLessons ?? 0 },
    { label: 'Quizzes feitos', value: data?.quizzesDone ?? 0 },
    { label: 'Duvidas em aberto', value: data?.openForumQuestions ?? 0 },
  ];

  const maxChartValue = useMemo(
    () => Math.max(...((data?.completionChart ?? []).map((item: any) => item.value) as number[]), 1),
    [data?.completionChart],
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1>Dashboard</h1>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {cards.map((card) => (
          <Card key={card.label}>
            <h2>{card.label}</h2>
            <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{card.value}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card>
          <h2>Engajamento Geral</h2>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {(data?.completionChart ?? []).map((item: any) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: '#deeaed', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: 12,
                      borderRadius: 999,
                      background: 'var(--primary)',
                      width: `${Math.max(8, Math.round((item.value / maxChartValue) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Top 5 Evolução</h2>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {(data?.topStudents ?? []).length === 0 && <p>Sem dados de evolução ainda.</p>}
            {(data?.topStudents ?? []).map((student: any, index: number) => (
              <div
                key={student.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  border: '1px solid var(--primary-soft)',
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <strong>
                  {index + 1}. {student.name}
                </strong>
                <span>{student.efficiency}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
