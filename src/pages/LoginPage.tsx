import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '@/assets/rpx-logo.png';
import { Button } from '@/components/Button';
import { FormField } from '@/components/shared/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { roleAccessMap, type Role } from '@/types/roles';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const privacyPolicyUrl = (import.meta.env.VITE_PRIVACY_POLICY_URL as string | undefined) || '/privacy-policy';
  const isExternalPrivacyUrl = /^https?:\/\//i.test(privacyPolicyUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin() {
    try {
      setLoggingIn(true);
      setError('');
      const { data } = await api.post('/auth/login', { email, password });
      setAuth({ token: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      const firstAllowed = roleAccessMap[data.user.role as Role]?.[0] ?? 'dashboard';
      navigate(`/${firstAllowed}`);
    } catch {
      setError('Nao foi possivel entrar. Verifique e-mail e senha.');
    } finally {
      setLoggingIn(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loggingIn) return;
    void handleLogin();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border bg-card/95 p-6 shadow-lg">
        <div className="mb-4 space-y-2 text-center">
          <img src={logo} alt="RPX" className="mx-auto w-full max-w-[240px] mb-8" />
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-muted-foreground">Use suas credenciais para acessar o painel administrativo.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField id="email" label="E-mail">
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rpx.com" />
          </FormField>
          <FormField id="password" label="Senha">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Digite sua senha"
            />
          </FormField>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" loading={loggingIn} disabled={loggingIn} className="w-full">
            Entrar
          </Button>

          {privacyPolicyUrl ? (
            <p className="text-center text-sm">
              <a
                href={privacyPolicyUrl}
                target={isExternalPrivacyUrl ? '_blank' : undefined}
                rel={isExternalPrivacyUrl ? 'noreferrer' : undefined}
              >
                Política de privacidade
              </a>
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
