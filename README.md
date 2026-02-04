# Smart Ranch Vision AI

## Visão Geral
Plataforma fullstack para monitoramento inteligente do rebanho, unificando operações, alertas, análises visuais e suporte de voz em tempo real. O sistema foi projetado para decisões rápidas, com UX enxuta e backend seguro, modular e escalável.

## Arquitetura e Decisões Técnicas
- **Frontend**: SPA em React com design system próprio, componentes reutilizáveis e foco em acessibilidade.
- **Backend**: API REST versionada + relay WebSocket para áudio, com validação, rate limit e logs estruturados.
- **Persistência**: armazenamento inicial em JSON com escrita atômica e fila de atualizações.
- **Segurança**: autenticação opcional via `x-api-key`, sanitização de payloads e headers de segurança.

## Stack e Tecnologias
- Vite + React 19 + TypeScript
- Tailwind via CDN (UI)
- Recharts (gráficos)
- Node.js + Express (API)
- WebSocket (`ws`) para relay de voz

## Funcionalidades Principais
- Painel executivo com KPIs e prioridades do dia.
- Monitoramento vivo com upload de frames, histórico persistido e exportação.
- Central de alertas com busca, filtros e criação de missões.
- Sala de operações com quadro de tarefas, playbooks e gestão de equipe.
- Assistente de voz com relay seguro no backend.
- API versionada com endpoints de histórico e resumo operacional.

## Estrutura do Projeto
- `App.tsx` — layout principal e orquestração de estado.
- `components/` — páginas e módulos do frontend.
- `components/ui/` — design system (Card, Badge, Button, SectionHeader, StatCard).
- `services/ai.ts` — cliente HTTP do backend.
- `server/src/index.js` — bootstrap, middlewares e WebSocket.
- `server/src/routes/` — endpoints REST.
- `server/src/services/` — integrações de visão.
- `server/src/storage.js` — persistência JSON.
- `server/src/utils/` — validação e sanitização.
- `server/tests/` — testes unitários do backend.

## Instalação e Execução
### Backend
1. Instale as dependências:
```
cd server
npm install
```
2. Crie `server/.env`:
```
AI_API_KEY=SUACHAVEAQUI
AI_VISION_URL=https://seu-endpoint/vision
AI_VOICE_WS_URL=wss://seu-endpoint/voice
AI_VOICE_INIT_PAYLOAD={"type":"start"}
API_ACCESS_KEY=SEU_TOKEN_INTERNO
CORS_ORIGINS=http://localhost:3000
HISTORY_MAX=500
REQUEST_LIMIT_MB=20
PORT=5174
```
3. Inicie o backend:
```
npm run dev
```

### Frontend
1. Na raiz do projeto:
```
npm install
npm run dev
```

Se `API_ACCESS_KEY` estiver habilitada no backend, defina no frontend:
```
VITE_API_TOKEN=SEU_TOKEN_INTERNO
```

O Vite faz proxy automático de `/api` e `/voice` para `http://localhost:5174`.

## Testes
Backend (unitários):
```
cd server
npm test
```

## Boas Práticas Adotadas
- Design system e tokens visuais para consistência UI.
- Componentes reutilizáveis e estados derivados com `useMemo`.
- API versionada e validações de entrada com limites de payload.
- Logging com `requestId` e cabeçalhos de segurança.
- Persistência com escrita atômica e fila de atualizações.

## Melhorias Futuras
- Persistência em banco (SQLite/Postgres) com migrations.
- Autenticação JWT + RBAC.
- Observabilidade com métricas e tracing.
- Cache inteligente para análises recorrentes.

---
Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/
