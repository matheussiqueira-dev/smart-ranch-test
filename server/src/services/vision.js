import { logger } from '../logger.js';
import config from '../config.js';

const visionPrompt = `Você é o sistema Smart Ranch AI Vision. Analise esta imagem de gado.
Identifique padrões de saúde visual, condição corporal (BCS), postura e comportamento.
Se a imagem não contiver gado, retorne 0 contagem e score null.
Para cada problema identificado, forneça uma descrição visual clara e possíveis causas veterinárias ou de manejo.
Seja preciso e técnico.`;

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

export const runVisionAnalysis = async (imageData) => {
  if (!config.aiVisionUrl) {
    logger.warn('AI_VISION_URL não configurada, retornando análise simulada.');
    return createMockAnalysis();
  }

  const response = await fetch(config.aiVisionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.aiApiKey ? { Authorization: `Bearer ${config.aiApiKey}` } : {}),
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

  const payload = await response.json();
  return payload?.result || payload;
};
