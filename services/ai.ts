import { AnalysisResult } from '../types';

const API_BASE = '/api';

export const analyzeFrame = async (base64Image: string, cameraId?: string): Promise<AnalysisResult> => {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const response = await fetch(`${API_BASE}/history`);

  if (!response.ok) {
    throw new Error('Falha ao carregar histórico.');
  }

  const payload = await response.json();
  return Array.isArray(payload.history) ? payload.history : [];
};
