import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { readStore, writeStore } from './storage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    cattleCount: {
      type: Type.NUMBER,
      description: 'Número aproximado de animais identificados na imagem.',
    },
    healthScore: {
      type: Type.NUMBER,
      description: 'Uma pontuação de saúde geral de 0 a 100 baseada na aparência visual (100 = perfeito, 0 = crítico).',
    },
    identifiedIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: {
            type: Type.STRING,
            description: 'Nome curto do problema identificado (ex: Manqueira, Magreza, Isolamento).',
          },
          description: {
            type: Type.STRING,
            description: 'Uma explicação detalhada do que foi observado visualmente na imagem relacionado a este problema.',
          },
          possibleCauses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de possíveis causas prováveis para este problema (nutricional, doença, trauma, etc).',
          },
        },
        required: ['issue', 'description', 'possibleCauses'],
      },
      description: 'Lista detalhada de problemas visuais detectados.',
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Ações recomendadas para o fazendeiro ou veterinário.',
    },
    summary: {
      type: Type.STRING,
      description: 'Um breve resumo técnico da análise visual.',
    },
  },
  required: ['cattleCount', 'healthScore', 'identifiedIssues', 'recommendations', 'summary'],
};

const voiceInstruction = `Você é a assistente virtual veterinária do Smart Ranch.
Fale de forma breve, profissional mas amigável.
Ajude o fazendeiro com dúvidas sobre saúde do gado, clima e recomendações de manejo.
Se perguntarem sobre o status atual, invente um resumo baseada em dados fictícios de 'saúde boa' e 'um alerta crítico no pasto norte'.`;

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
    if (!ai) {
      return res.status(500).json({ message: 'GEMINI_API_KEY não configurada no backend.' });
    }

    const { base64Image, cameraId } = req.body;

    if (!base64Image) {
      return res.status(400).json({ message: 'Imagem não enviada.' });
    }

    const imageData = typeof base64Image === 'string' && base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData,
            },
          },
          {
            text: `Você é o sistema Smart Ranch AI Vision. Analise esta imagem de gado.
            Identifique padrões de saúde visual, condição corporal (BCS), postura e comportamento.
            Se a imagem não contiver gado, retorne 0 contagem e score null.
            Para cada problema identificado, forneça uma descrição visual clara e possíveis causas veterinárias ou de manejo.
            Seja preciso e técnico.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ message: 'Sem resposta do modelo.' });
    }

    const json = JSON.parse(text);

    const result = {
      timestamp: new Date().toISOString(),
      cameraId,
      cattleCount: json.cattleCount || 0,
      identifiedIssues: json.identifiedIssues || [],
      healthScore: json.healthScore || 0,
      recommendations: json.recommendations || [],
      rawAnalysis: json.summary || 'Análise concluída.',
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
    ws.send(JSON.stringify(payload));
  }
};

wss.on('connection', async (ws) => {
  if (!ai) {
    safeSend(ws, { type: 'error', message: 'GEMINI_API_KEY não configurada no backend.' });
    ws.close();
    return;
  }

  let session = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: voiceInstruction,
      },
      callbacks: {
        onopen: () => {
          safeSend(ws, { type: 'ready' });
        },
        onmessage: (message) => {
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            safeSend(ws, { type: 'audio', data: base64Audio });
          }

          if (message.serverContent?.interrupted) {
            safeSend(ws, { type: 'interrupted' });
          }
        },
        onclose: () => {
          ws.close();
        },
        onerror: (error) => {
          console.error('Erro na sessão Gemini Live:', error);
          safeSend(ws, { type: 'error', message: 'Erro na conexão com a IA.' });
          ws.close();
        },
      },
    });
  } catch (error) {
    console.error('Falha ao iniciar sessão de voz:', error);
    safeSend(ws, { type: 'error', message: 'Falha ao iniciar sessão de voz.' });
    ws.close();
    return;
  }

  ws.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());

      if (payload?.type === 'audio' && payload?.data) {
        session?.sendRealtimeInput({
          media: {
            data: payload.data,
            mimeType: payload.mimeType || 'audio/pcm;rate=16000',
          },
        });
      }

      if (payload?.type === 'stop') {
        session?.close();
      }
    } catch (error) {
      console.warn('Mensagem inválida no relay de voz', error);
    }
  });

  ws.on('close', () => {
    try {
      session?.close();
    } catch {
      // ignore
    }
  });
});

server.listen(PORT, () => {
  console.log(`Smart Ranch backend rodando em http://localhost:${PORT}`);
});
