import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { api } from '@/services/api';

export function QuizzesPage() {
  const location = useLocation();
  const routeState = (location.state ?? {}) as { openCreateQuiz?: boolean; courseId?: string };

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/courses')).data,
  });

  const quizzes = useMemo(
    () =>
      (courses ?? []).flatMap((course: any) =>
        (course.quizzes ?? []).map((quiz: any) => ({
          ...quiz,
          courseTitle: course.title,
        })),
      ),
    [courses],
  );

  const [quizModalOpen, setQuizModalOpen] = useState(Boolean(routeState.openCreateQuiz));
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const [courseId, setCourseId] = useState(routeState.courseId ?? courses?.[0]?.id ?? '');
  const [selectedQuizId, setSelectedQuizId] = useState('');

  const [statement, setStatement] = useState('');
  const [order, setOrder] = useState(1);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correct, setCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  useEffect(() => {
    if (!courseId && courses?.length) setCourseId(courses[0].id);
  }, [courseId, courses]);

  useEffect(() => {
    if (!selectedQuizId && quizzes?.length) setSelectedQuizId(quizzes[0].id);
  }, [selectedQuizId, quizzes]);

  async function createQuiz() {
    try {
      setSavingQuiz(true);
      const { data } = await api.post('/quizzes', { courseId, maxAttempts: 1 });
      setSelectedQuizId(data.id);
      setQuizModalOpen(false);
      setQuestionModalOpen(true);
      window.alert('Quiz criado. Agora adicione as perguntas e respostas.');
    } finally {
      setSavingQuiz(false);
    }
  }

  async function createQuestion() {
    const options = [
      { text: optionA, isCorrect: correct === 'A' },
      { text: optionB, isCorrect: correct === 'B' },
      { text: optionC, isCorrect: correct === 'C' },
      { text: optionD, isCorrect: correct === 'D' },
    ];

    try {
      setSavingQuestion(true);
      await api.post('/quizzes/questions', {
        quizId: selectedQuizId,
        statement,
        order,
        options,
      });

      setStatement('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrect('A');
      setOrder((prev) => prev + 1);
      window.alert('Pergunta criada.');
    } finally {
      setSavingQuestion(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Quizzes (Pré e Pós-curso)</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setQuizModalOpen(true)}>Adicionar quiz</Button>
          <Button onClick={() => setQuestionModalOpen(true)}>Adicionar pergunta</Button>
        </div>
      </div>

      <Card>
        <h2>Resumo</h2>
        <p>Quizzes cadastrados: {quizzes.length}</p>
        <p>Agora cada curso usa um quiz unico, reaproveitado no pre e no pos.</p>
      </Card>

      <Modal title="Adicionar quiz" open={quizModalOpen} onClose={() => setQuizModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Curso
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="" disabled>
                Selecione um curso
              </option>
              {(courses ?? []).map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <Button
            loading={savingQuiz}
            disabled={savingQuiz}
            onClick={() => {
              if (!courseId) {
                window.alert('Selecione um curso.');
                return;
              }
              createQuiz();
            }}
          >
            Salvar quiz
          </Button>
        </div>
      </Modal>

      <Modal title="Adicionar pergunta e respostas" open={questionModalOpen} onClose={() => setQuestionModalOpen(false)}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            Quiz existente
            <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)}>
              <option value="" disabled>
                Selecione um quiz
              </option>
              {quizzes.map((quiz: any) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.courseTitle} ({quiz.type})
                </option>
              ))}
            </select>
          </label>

          <label>
            Ordem da pergunta
            <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value) || 1)} />
          </label>

          <label>
            Enunciado
            <textarea value={statement} onChange={(e) => setStatement(e.target.value)} />
          </label>

          <label>Resposta A<input value={optionA} onChange={(e) => setOptionA(e.target.value)} /></label>
          <label>Resposta B<input value={optionB} onChange={(e) => setOptionB(e.target.value)} /></label>
          <label>Resposta C<input value={optionC} onChange={(e) => setOptionC(e.target.value)} /></label>
          <label>Resposta D<input value={optionD} onChange={(e) => setOptionD(e.target.value)} /></label>

          <label>
            Resposta correta
            <select value={correct} onChange={(e) => setCorrect(e.target.value as 'A' | 'B' | 'C' | 'D')}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>

          <Button
            loading={savingQuestion}
            disabled={savingQuestion}
            onClick={() => {
              if (!selectedQuizId || !statement.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
                window.alert('Preencha quiz, enunciado e todas as respostas.');
                return;
              }
              createQuestion();
            }}
          >
            Salvar pergunta
          </Button>
        </div>
      </Modal>
    </div>
  );
}
