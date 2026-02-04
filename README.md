# Smart Ranch Vision AI

Plataforma de monitoramento inteligente para fazendas, combinando visão computacional, analytics e um centro operacional com alertas e histórico persistido.

## Arquitetura
- **Frontend**: Vite + React + TypeScript.
- **Backend**: Node.js + Express (protege a API Key do Gemini e persiste o histórico em arquivo JSON).
- **Comunicação**: o frontend consome `/api` via proxy do Vite.

## Pré-requisitos
- Node.js 18+

## Backend (protege API Key e salva histórico)
1. Entre na pasta `server` e instale as dependências:
```
npm install
```
2. Crie o arquivo `server/.env` com sua chave:
```
GEMINI_API_KEY=SUACHAVEAQUI
PORT=5174
```
3. Suba o backend:
```
npm run dev
```
Ou, pela raiz:
```
npm run dev:server
```

## Frontend
1. Na raiz do projeto, instale as dependências:
```
npm install
```
2. (Opcional) Para o **assistente de voz**, crie `.env.local` na raiz:
```
VITE_GEMINI_API_KEY=SUACHAVEAQUI
```
3. Rode o frontend:
```
npm run dev
```

O Vite faz proxy automático de `/api` para `http://localhost:5174`.

## Observações
- O histórico é persistido em `server/data/history.json`.
- A análise de imagens **não expõe** a API Key no frontend.
- O assistente de voz ainda usa a chave no frontend (melhoria futura: proxy/relay também no backend).
