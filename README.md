# Smart Ranch Vision AI — Backend

## Visão Geral do Backend
Backend responsável por orquestrar análises de imagem, persistir histórico e fornecer um relay seguro para áudio em tempo real. O foco é segurança, performance e escalabilidade, mantendo contratos claros para o frontend.

## Arquitetura
- **Monólito modular** com camadas de configuração, middleware, serviços, rotas e persistência.
- **Entrada única** em `server/src/index.js` com rotas versionadas (`/api/v1`).
- **Relay de voz** via WebSocket (`/voice`) com proteção opcional por token.

## Tecnologias Utilizadas
- Node.js (ESM)
- Express
- WebSocket (`ws`)
- Persistência em JSON com escrita atômica

## Setup e Execução
1. Instale dependências:
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
3. Execute:
```
npm run dev
```

## Estrutura do Projeto
- `server/src/index.js` — bootstrap, middlewares e WebSocket.
- `server/src/config.js` — variáveis de ambiente e defaults.
- `server/src/logger.js` — logging estruturado.
- `server/src/middleware/` — auth, rate limit e error handler.
- `server/src/routes/api.js` — endpoints REST versionados.
- `server/src/services/vision.js` — integração com provedor externo de visão.
- `server/src/storage.js` — persistência em arquivo JSON com escrita atômica.
- `server/src/utils/validation.js` — validação e sanitização de dados.

## Endpoints Principais
- `GET /api/health` — health check.
- `GET /api/v1/history` — histórico paginado e filtrável por câmera.
- `GET /api/v1/history/:id` — item específico do histórico.
- `GET /api/v1/summary` — resumo operacional (média, críticos, total).
- `POST /api/v1/analyze` — análise de imagem e persistência do resultado.
- `WS /voice` — relay seguro de áudio.

## Boas Práticas e Padrões
- Validação de entrada e sanitização de base64.
- Rate limiting simples e headers de segurança.
- Autenticação por `x-api-key` (opcional).
- Escrita atômica no storage com fila de updates.
- Logs com `requestId` para rastreabilidade.

## Melhorias Futuras
- Persistência em banco (PostgreSQL/SQLite).
- Autenticação JWT e RBAC.
- Observabilidade com métricas e tracing.
- Cache inteligente para resultados repetidos.

---
Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/
