import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { api } from '@/services/api';

export function RankingPage() {
  const { data } = useQuery({ queryKey: ['ranking'], queryFn: async () => (await api.get('/ranking')).data });

  function exportCsv() {
    if (!data?.length) return;
    const lines = ['posicao,nome,eficiencia,mediaQuiz,aulasConcluidas'];
    for (const item of data) {
      lines.push(`${item.position},${item.name},${item.efficiency},${item.quizAverage},${item.completedLessons}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranking.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1>Ranking</h1>
      <Button onClick={exportCsv}>Exportar CSV</Button>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Posicao</th>
              <th align="left">Nome</th>
              <th align="left">Eficiencia</th>
              <th align="left">Media quiz</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row: any) => (
              <tr key={row.userId}>
                <td>{row.position}</td>
                <td>{row.name}</td>
                <td>{row.efficiency}</td>
                <td>{row.quizAverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
