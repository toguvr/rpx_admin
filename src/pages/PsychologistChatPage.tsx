import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { CircleDot } from 'lucide-react';

import { Button } from '@/components/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

function getSocketBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL as string;
  if (!apiUrl) return 'http://localhost:3333';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function PsychologistChatPage() {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const socketRef = useRef<Socket | null>(null);
  const selectedThreadIdRef = useRef('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const [online, setOnline] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, selectedThreadId]);

  async function loadThreads() {
    const { data } = await api.get('/psychologist-chat/threads');
    setThreads(data);

    if (!selectedThreadId && data.length > 0) {
      setSelectedThreadId(data[0].id);
    }
  }

  async function loadOnlineStatus() {
    const { data } = await api.get('/psychologist-chat/online-status');
    setOnline(Boolean(data.online));
  }

  async function loadMessages(threadId: string) {
    if (!threadId) return;
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/psychologist-chat/threads/${threadId}/messages`);
      setMessages(data);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoadingThreads(true);
        await Promise.all([loadThreads(), loadOnlineStatus()]);
      } finally {
        setLoadingThreads(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedThreadId) return;
    loadMessages(selectedThreadId);
  }, [selectedThreadId]);

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(getSocketBaseUrl(), {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (selectedThreadId) {
        socket.emit('chat:thread:join', selectedThreadId);
      }
    });

    socket.on('chat:psychologist-online', (payload: { online: boolean }) => {
      setOnline(Boolean(payload.online));
    });

    socket.on('chat:message:new', (payload: { threadId: string; message: any }) => {
      setThreads((prev) => {
        const exists = prev.some((thread) => thread.id === payload.threadId);

        const next = exists
          ? prev.map((thread) =>
              thread.id === payload.threadId
                ? {
                    ...thread,
                    lastMessageAt: payload.message.createdAt,
                    messages: [payload.message],
                  }
                : thread,
            )
          : prev;

        return [...next].sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
        );
      });

      if (payload.threadId === selectedThreadIdRef.current) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedThreadId || !socketRef.current) return;
    socketRef.current.emit('chat:thread:join', selectedThreadId);
  }, [selectedThreadId]);

  async function sendMessage() {
    if (!selectedThreadId || !body.trim()) return;

    try {
      setSending(true);
      await api.post(`/psychologist-chat/threads/${selectedThreadId}/messages`, {
        body: body.trim(),
      });
      setBody('');
      await loadThreads();
    } finally {
      setSending(false);
    }
  }

  function riskBadge(thread: any) {
    const risk = thread?.risk;
    if (!risk?.waitingPsychologistResponse) {
      return <Badge variant="secondary">Sem risco</Badge>;
    }

    if (risk.level === 'HIGH') {
      return <Badge variant="destructive">{`Risco alto (${risk.waitingHours}h)`}</Badge>;
    }

    if (risk.level === 'MEDIUM') {
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500">{`Risco médio (${risk.waitingHours}h)`}</Badge>;
    }

    if (risk.level === 'LOW') {
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">{`Risco baixo (${risk.waitingHours}h)`}</Badge>;
    }

    return <Badge variant="secondary">{`Aguardando (${risk.waitingHours}h)`}</Badge>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Atendimento Psicológico"
        description="Central de conversas em tempo real entre alunos e psicólogos."
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleDot className={online ? 'text-green-600' : 'text-red-600'} size={14} />
        Psicólogos {online ? 'online' : 'offline'}
      </div>

      <div className="chat-layout grid gap-4">
        <SectionCard title="Conversas" description="Threads ativas e histórico recente.">
          <div className="grid">
            {loadingThreads && <p className="p-3 text-sm text-muted-foreground">Carregando...</p>}

            {!loadingThreads &&
              threads.map((thread) => {
                const lastMessage = thread.messages?.[0];
                const active = thread.id === selectedThreadId;

                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`border-b p-3 text-left transition ${active ? 'bg-primary/10' : 'hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{thread.user?.name ?? 'Aluno'}</div>
                      <div>{riskBadge(thread)}</div>
                    </div>
                    <div className="mt-1 truncate text-sm text-muted-foreground">{lastMessage?.body ?? 'Conversa iniciada'}</div>
                  </button>
                );
              })}

            {!loadingThreads && threads.length === 0 && <p className="p-3 text-sm text-muted-foreground">Sem conversas no momento.</p>}
          </div>
        </SectionCard>

        <Card className="grid grid-rows-[auto_1fr_auto] gap-3 p-4">
          <div className="border-b pb-2">
            <strong>{selectedThread?.user?.name ?? 'Selecione uma conversa'}</strong>
          </div>

          <div
            ref={messagesContainerRef}
            className="grid max-h-[520px] gap-2 overflow-auto rounded-md border bg-muted/10 p-3"
          >
            {loadingMessages && <p className="text-sm text-muted-foreground">Carregando mensagens...</p>}
            {!loadingMessages && messages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}

            {!loadingMessages &&
              messages.map((message) => {
                const mine = message.senderId === userId || message.sender?.id === userId;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-xl border px-3 py-2 ${mine ? 'justify-self-end border-primary bg-primary text-primary-foreground' : 'justify-self-start bg-card'}`}
                  >
                    <div className="mb-1 text-xs font-semibold opacity-80">{message.sender?.name}</div>
                    <div className="text-sm">{message.body}</div>
                  </div>
                );
              })}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Responder</label>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Digite uma resposta clara e acolhedora"
              disabled={!selectedThreadId}
              className="min-h-[96px]"
            />
            <Button onClick={sendMessage} disabled={!selectedThreadId || !body.trim() || sending} loading={sending}>
              Enviar mensagem
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
