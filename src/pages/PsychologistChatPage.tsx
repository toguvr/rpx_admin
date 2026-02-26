import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
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
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1>Atendimento Psicológico</h1>
      <p style={{ margin: 0, color: 'var(--gray-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            display: 'inline-block',
            background: online ? '#1f9d66' : '#c53a3a',
          }}
        />
        Psicólogos {online ? 'online' : 'offline'}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          minHeight: 0,
        }}
      >
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--primary-soft)' }}>
            <strong>Conversas</strong>
          </div>

          <div style={{ display: 'grid' }}>
            {loadingThreads && <p style={{ padding: 12 }}>Carregando...</p>}

            {!loadingThreads &&
              threads.map((thread) => {
                const lastMessage = thread.messages?.[0];
                const active = thread.id === selectedThreadId;

                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    style={{
                      border: 'none',
                      borderBottom: '1px solid var(--primary-soft)',
                      background: active ? 'var(--primary-soft)' : '#fff',
                      textAlign: 'left',
                      padding: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{thread.user?.name ?? 'Aluno'}</div>
                    <div style={{ color: 'var(--gray-1)', marginTop: 4, fontSize: 14 }}>
                      {lastMessage?.body ?? 'Conversa iniciada'}
                    </div>
                  </button>
                );
              })}

            {!loadingThreads && threads.length === 0 && <p style={{ padding: 12 }}>Sem conversas no momento.</p>}
          </div>
        </Card>

        <Card style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 12 }}>
          <div style={{ borderBottom: '1px solid var(--primary-soft)', paddingBottom: 8 }}>
            <strong>{selectedThread?.user?.name ?? 'Selecione uma conversa'}</strong>
          </div>

          <div
            ref={messagesContainerRef}
            style={{ overflow: 'auto', maxHeight: 420, display: 'grid', gap: 8, alignContent: 'start' }}
          >
            {loadingMessages && <p>Carregando mensagens...</p>}
            {!loadingMessages && messages.length === 0 && <p>Nenhuma mensagem ainda.</p>}

            {!loadingMessages &&
              messages.map((message) => {
                const mine = message.senderId === userId || message.sender?.id === userId;
                return (
                  <div
                    key={message.id}
                    style={{
                      justifySelf: mine ? 'end' : 'start',
                      background: mine ? 'var(--primary)' : '#fff',
                      color: mine ? '#fff' : 'var(--text)',
                      border: `1px solid ${mine ? 'var(--primary)' : 'var(--primary-soft)'}`,
                      borderRadius: 12,
                      padding: '10px 12px',
                      maxWidth: 'min(85%, 640px)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{message.sender?.name}</div>
                    <div>{message.body}</div>
                  </div>
                );
              })}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontWeight: 700 }}>Responder</label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Digite uma resposta clara e acolhedora"
              disabled={!selectedThreadId}
              style={{ minHeight: 90 }}
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
