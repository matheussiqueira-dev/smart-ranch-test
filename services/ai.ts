import { AnalysisResult } from '../types';

const API_BASE = '/api';
const API_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;

const baseHeaders = {
  ...(API_TOKEN ? { 'x-api-key': API_TOKEN } : {}),
};

export const analyzeFrame = async (base64Image: string, cameraId?: string): Promise<AnalysisResult> => {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...baseHeaders,
    },
    body: JSON.stringify({ base64Image, cameraId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.message || 'Falha ao analisar imagem.';
    throw new Error(message);
  }

  return response.json();
};

export const fetchHistory = async (): Promise<AnalysisResult[]> => {
  const response = await fetch(`${API_BASE}/history`, {
    headers: {
      ...baseHeaders,
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar histórico.');
  }

  const payload = await response.json();
  return Array.isArray(payload.history) ? payload.history : [];
};
