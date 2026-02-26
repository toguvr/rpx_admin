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

  const completionEntries = data?.completionChart ?? [];
  const linePoints = useMemo(() => {
    if (!completionEntries.length) return '';
    return completionEntries
      .map((item: any, index: number) => {
        const x = completionEntries.length === 1 ? 210 : Math.round((index / (completionEntries.length - 1)) * 420);
        const y = Math.round(180 - (item.value / maxChartValue) * 160);
        return `${x},${Math.max(12, y)}`;
      })
      .join(' ');
  }, [completionEntries, maxChartValue]);

  const pieData = [
    { label: 'Aulas', value: data?.watchedLessons ?? 0, color: '#0f766e' },
    { label: 'Quizzes', value: data?.quizzesDone ?? 0, color: '#0e7490' },
    { label: 'Dúvidas', value: data?.openForumQuestions ?? 0, color: '#334155' },
  ];
  const pieTotal = Math.max(1, pieData.reduce((acc, item) => acc + item.value, 0));
  const pieSlices = useMemo(() => {
    let start = 0;
    return pieData.map((slice) => {
      const angle = (slice.value / pieTotal) * Math.PI * 2;
      const end = start + angle;
      const x1 = 100 + 84 * Math.cos(start);
      const y1 = 100 + 84 * Math.sin(start);
      const x2 = 100 + 84 * Math.cos(end);
      const y2 = 100 + 84 * Math.sin(end);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M 100 100 L ${x1} ${y1} A 84 84 0 ${largeArc} 1 ${x2} ${y2} Z`;
      start = end;
      return { ...slice, path };
    });
  }, [pieData, pieTotal]);

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
          <h2>Linha de evolução</h2>
          {!completionEntries.length && <p>Sem dados suficientes.</p>}
          {!!completionEntries.length && (
            <div style={{ overflowX: 'auto' }}>
              <svg viewBox="0 0 420 200" style={{ width: '100%', minWidth: 360 }}>
                <line x1="0" y1="180" x2="420" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                <polyline points={linePoints} fill="none" stroke="var(--primary)" strokeWidth="3" />
                {completionEntries.map((item: any, index: number) => {
                  const x = completionEntries.length === 1 ? 210 : Math.round((index / (completionEntries.length - 1)) * 420);
                  const y = Math.max(12, Math.round(180 - (item.value / maxChartValue) * 160));
                  return (
                    <g key={item.label}>
                      <circle cx={x} cy={y} r="4" fill="#0f766e" />
                      <text x={x} y="196" fontSize="11" textAnchor="middle" fill="#64748b">
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </Card>

        <Card>
          <h2>Distribuição (pizza)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, alignItems: 'center' }}>
            <svg viewBox="0 0 200 200" style={{ width: 180, maxWidth: '100%' }}>
              {pieSlices.map((slice) => (
                <path key={slice.label} d={slice.path} fill={slice.color} />
              ))}
              <circle cx="100" cy="100" r="44" fill="#fff" />
            </svg>
            <div style={{ display: 'grid', gap: 8 }}>
              {pieData.map((slice) => (
                <div key={slice.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: slice.color, display: 'inline-block' }} />
                  <strong>{slice.label}</strong>
                  <span style={{ color: 'var(--gray-1)' }}>{slice.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

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
