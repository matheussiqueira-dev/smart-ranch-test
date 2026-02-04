# Smart Ranch Vision AI

## Visão Geral
Plataforma de monitoramento inteligente para fazendas, combinando visão computacional, análises operacionais e um centro de decisões para saúde, segurança e produtividade do rebanho.

## Tecnologias Utilizadas
- Vite + React 19 + TypeScript
- Tailwind via CDN (UI)
- Recharts (gráficos)
- Backend Node.js + Express (proxy seguro, persistência e relay)

## Funcionalidades Principais
- Dashboard estratégico com KPIs de saúde, alertas e missões prioritárias.
- Monitoramento vivo com upload de frames, histórico persistido e exportação JSON por câmera.
- Central de alertas com filtros inteligentes e criação de missões operacionais.
- Sala de operações com quadro de tarefas, playbooks e cobertura da equipe.
- Assistente de voz em tempo real via relay seguro no backend.

## Instalação e Uso
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
- `components/` — módulos de UI (Dashboard, LiveMonitor, Analytics, Alerts, Operations, VoiceAgent, Sidebar, Icons).
- `services/ai.ts` — cliente HTTP do backend.
- `server/src/index.js` — API, persistência e relay de voz.
- `server/src/storage.js` — persistência em JSON.
- `types.ts` — modelos tipados e contratos compartilhados.

## Boas Práticas
- Dados críticos isolados no backend, evitando exposição de credenciais.
- Tipagem forte e contratos estáveis para features operacionais.
- Fallback com análise simulada quando o provedor externo está indisponível.
- UI responsiva e hierarquia clara para uso em campo.

## Possíveis Melhorias Futuras
- Persistência em banco (PostgreSQL/SQLite) com auditoria.
- Autenticação e RBAC por equipes.
- Pipeline de observabilidade com logs estruturados e métricas.
- Camada de cache para análises recorrentes.

---
Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/
