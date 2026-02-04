import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { readStore, writeStore } from './storage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_VISION_URL = process.env.AI_VISION_URL;
const AI_VOICE_WS_URL = process.env.AI_VOICE_WS_URL;
const AI_VOICE_INIT_PAYLOAD = process.env.AI_VOICE_INIT_PAYLOAD;

const analysisSchema = {
  type: 'object',
  properties: {
    cattleCount: { type: 'number' },
    healthScore: { type: 'number' },
    identifiedIssues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issue: { type: 'string' },
          description: { type: 'string' },
          possibleCauses: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    recommendations: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
};

const visionPrompt = `Você é o sistema Smart Ranch AI Vision. Analise esta imagem de gado.
Identifique padrões de saúde visual, condição corporal (BCS), postura e comportamento.
Se a imagem não contiver gado, retorne 0 contagem e score null.
Para cada problema identificado, forneça uma descrição visual clara e possíveis causas veterinárias ou de manejo.
Seja preciso e técnico.`;

const createMockAnalysis = () => {
  const baseScore = 88 + Math.round(Math.random() * 8);
  return {
    cattleCount: 12 + Math.round(Math.random() * 6),
    healthScore: baseScore,
    identifiedIssues: [],
    recommendations: ['Manter rotina de monitoramento e hidratação.'],
    summary: 'Análise simulada: rebanho com comportamento estável e sinais de bem-estar adequados.',
  };
};

const callVisionProvider = async (imageData) => {
  if (!AI_VISION_URL) return null;

  const response = await fetch(AI_VISION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      image: imageData,
      prompt: visionPrompt,
      schema: analysisSchema,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha no provedor de IA.');
  }

  return response.json();
};

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/history', async (req, res) => {
  try {
    const { cameraId } = req.query;
    const store = await readStore();
    let history = store.history;

    if (cameraId) {
      history = history.filter((item) => item.cameraId === cameraId);
    }

    history = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ history });
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    res.status(500).json({ message: 'Falha ao carregar histórico.' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { base64Image, cameraId } = req.body;

    if (!base64Image) {
      return res.status(400).json({ message: 'Imagem não enviada.' });
    }

    const imageData = typeof base64Image === 'string' && base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    let providerResult = null;
    try {
      providerResult = await callVisionProvider(imageData);
    } catch (error) {
      console.warn('Falha no provedor externo, usando análise simulada.', error);
    }

    const normalized = providerResult?.result || providerResult || createMockAnalysis();

    const result = {
      timestamp: new Date().toISOString(),
      cameraId,
      cattleCount: normalized.cattleCount || 0,
      identifiedIssues: normalized.identifiedIssues || [],
      healthScore: normalized.healthScore || 0,
      recommendations: normalized.recommendations || [],
      rawAnalysis: normalized.summary || 'Análise concluída.',
    };

    const store = await readStore();
    store.history.unshift(result);

    if (store.history.length > 500) {
      store.history = store.history.slice(0, 500);
    }

    await writeStore(store);

    res.json(result);
  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    res.status(500).json({ message: 'Falha ao analisar imagem.' });
  }
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/voice' });

const safeSend = (ws, payload) => {
  if (ws.readyState === ws.OPEN) {
    ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }
};

wss.on('connection', (clientSocket) => {
  if (!AI_VOICE_WS_URL) {
    safeSend(clientSocket, { type: 'error', message: 'Relay de voz não configurado no backend.' });
    clientSocket.close();
    return;
  }

  const upstream = new WebSocket(AI_VOICE_WS_URL, {
    headers: AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : undefined,
  });

  upstream.on('open', () => {
    if (AI_VOICE_INIT_PAYLOAD) {
      try {
        upstream.send(AI_VOICE_INIT_PAYLOAD);
      } catch (error) {
        console.warn('Falha ao enviar payload inicial para o relay upstream.', error);
      }
    }
  });

  upstream.on('message', (data) => {
    const payload = typeof data === 'string' ? data : data.toString();
    safeSend(clientSocket, payload);
  });

  upstream.on('close', () => {
    clientSocket.close();
  });

  upstream.on('error', (error) => {
    console.error('Erro no relay upstream de voz:', error);
    safeSend(clientSocket, { type: 'error', message: 'Falha ao conectar no relay upstream.' });
    clientSocket.close();
  });

  clientSocket.on('message', (data) => {
    if (upstream.readyState !== upstream.OPEN) return;
    const payload = typeof data === 'string' ? data : data.toString();
    upstream.send(payload);
  });

  clientSocket.on('close', () => {
    try {
      upstream.close();
    } catch {
      // ignore
    }
  });
});

server.listen(PORT, () => {
  console.log(`Smart Ranch backend rodando em http://localhost:${PORT}`);
});
