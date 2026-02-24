import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '@/assets/rpx.svg';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { roleAccessMap, type Role } from '@/types/roles';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const privacyPolicyUrl = (import.meta.env.VITE_PRIVACY_POLICY_URL as string | undefined) || '/privacy-policy';
  const isExternalPrivacyUrl = /^https?:\/\//i.test(privacyPolicyUrl);
  const [email, setEmail] = useState('admin@rpx.com');
  const [password, setPassword] = useState('Admin@123');
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

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <img
          src={logo}
          alt="RPX"
          style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto 12px' }}
        />
        <Card style={{ width: '100%' }}>
          <h1>Entrar</h1>
          <p>Use suas credenciais para acessar o painel administrativo.</p>
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              E-mail
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rpx.com" />
            </label>
            <label>
              Senha
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Digite sua senha" />
            </label>
            {error && <p style={{ color: 'var(--error)', margin: 0 }}>{error}</p>}
            <Button onClick={handleLogin} loading={loggingIn} disabled={loggingIn}>
              Entrar
            </Button>
            {privacyPolicyUrl && (
              <p style={{ margin: 0, textAlign: 'center' }}>
                <a
                  href={privacyPolicyUrl}
                  target={isExternalPrivacyUrl ? '_blank' : undefined}
                  rel={isExternalPrivacyUrl ? 'noreferrer' : undefined}
                >
                  Política de privacidade
                </a>
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
