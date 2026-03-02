import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import logo from '@/assets/rpx-logo.png';
import { Button } from '@/components/Button';
import { FormField } from '@/components/shared/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

function getStoreUrl() {
  const appStoreUrl = import.meta.env.VITE_MOBILE_APP_STORE_URL as string | undefined;
  const playStoreUrl = import.meta.env.VITE_MOBILE_PLAY_STORE_URL as string | undefined;
  const fallbackUrl = (import.meta.env.VITE_MOBILE_FALLBACK_URL as string | undefined) || '/';
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(ua)) return appStoreUrl || fallbackUrl;
  if (/Android/i.test(ua)) return playStoreUrl || fallbackUrl;
  return fallbackUrl;
}

export function InviteActivationPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setError('Link invalido.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas nao conferem.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await api.post('/auth/complete-invite', {
        token,
        password,
      });

      setSuccess('Senha definida com sucesso. Redirecionando para o app...');
      window.setTimeout(() => {
        window.location.href = getStoreUrl();
      }, 1200);
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || 'Nao foi possivel definir a senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md border bg-card/95 p-6 shadow-lg">
        <div className="mb-6 space-y-3 text-center">
          <img src={logo} alt="RPX" className="mx-auto w-full max-w-[220px]" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Defina sua senha</h1>
            <p className="text-sm text-muted-foreground">
              Use esta tela para concluir o acesso inicial ou redefinir a senha do app do aluno.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField id="password" label="Nova senha">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 8 caracteres"
            />
          </FormField>

          <FormField id="confirmPassword" label="Confirmar senha">
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a senha"
            />
          </FormField>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <Button onClick={handleSubmit} loading={submitting} disabled={submitting || !token} className="w-full">
            Salvar senha e abrir app
          </Button>
        </div>
      </Card>
    </div>
  );
}
