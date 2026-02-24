# rpx_admin

Painel administrativo web da plataforma RPX Cursos.

## Stack
- Vite + React + TypeScript
- React Router
- TanStack Query
- Zustand
- Axios

## UX e acessibilidade
- fonte base 16px+
- botoes 44px+
- sidebar simples com poucos itens
- mensagens de erro claras e confirmacao para exclusao
- alto contraste com paleta RPX

## Rodar local
1. Instale dependencias:
```bash
npm install
```

2. Configure env:
```bash
cp .env.example .env
```

3. Rode:
```bash
npm run dev
```

## Scripts
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`
- `npm run test`

## Integracao
- API esperada em `VITE_API_URL` (padrao `http://localhost:3333/api`)
- Pagina de politica local em `/privacy-policy`
- Link da politica de privacidade em `VITE_PRIVACY_POLICY_URL` (opcional; se vazio, usa `/privacy-policy`)
- Login seed recomendado: `admin@rpx.com / Admin@123`
- Login psicologo: `psicologo@rpx.com / Psico@123`
- Perfil `PSICOLOGO` acessa a tela `Atendimentos` com chat em tempo real (Socket.IO)
# rpx_admin
