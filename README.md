# Smart Ranch Vision AI

## Visão Geral do Frontend
Interface operacional para monitoramento do rebanho com foco em decisões rápidas, clareza de prioridade e experiência de uso em campo. O frontend consolida alertas, histórico de análises, tarefas e fluxos de ação em um painel responsivo e acessível.

## Stack e Tecnologias
- Vite + React 19 + TypeScript
- Tailwind via CDN (UI)
- Recharts (gráficos)
- Relay seguro via backend (API + WebSocket)

## Funcionalidades Principais
- Painel executivo com KPIs e prioridades do dia.
- Monitoramento vivo com upload de frames, histórico persistido e exportação.
- Central de alertas com busca, filtros e criação de missões.
- Sala de operações com quadro de tarefas, playbooks e gestão de equipe.
- Assistente de voz com relay seguro e status em tempo real.

## Setup e Build
### Backend (proxy seguro e histórico)
1. Entre em `server` e instale as dependências:
```
npm install
```
2. Crie `server/.env`:
```
AI_API_KEY=SUACHAVEAQUI
AI_VISION_URL=https://seu-endpoint/vision
AI_VOICE_WS_URL=wss://seu-endpoint/voice
AI_VOICE_INIT_PAYLOAD={"type":"start"}
PORT=5174
```
3. Suba o backend:
```
npm run dev
```
Ou pela raiz:
```
npm run dev:server
```

### Frontend
1. Na raiz do projeto, instale as dependências:
```
npm install
```
2. Rode o frontend:
```
npm run dev
```

O Vite faz proxy automático de `/api` e `/voice` para `http://localhost:5174`.

## Estrutura do Projeto
- `App.tsx` — layout principal e navegação entre módulos.
- `components/` — páginas e componentes de UI.
- `components/ui/` — design system (Card, Badge, Button, SectionHeader, StatCard).
- `data.ts` — mocks e dados iniciais para ambiente de demonstração.
- `services/ai.ts` — cliente HTTP do backend.
- `server/` — API, persistência e relay de voz.
- `types.ts` — modelos e contratos compartilhados.

## Boas Práticas Adotadas
- Design system com tokens visuais e componentes reutilizáveis.
- Estados derivados com `useMemo` para melhor performance.
- Separação de dados, UI e serviços para escalabilidade.
- Acessibilidade em inputs, filtros e ações críticas.

## Melhorias Futuras
- Persistência em banco (SQLite/Postgres) e trilha de auditoria.
- Autenticação e RBAC por equipe.
- Observabilidade com logs estruturados e métricas.
- Cache para análises recorrentes e otimização de custos.

---
Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/
