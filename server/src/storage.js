import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'history.json');
let writeQueue = Promise.resolve();

const createDefaultHistory = () => [
  {
    id: 'seed-1',
    cameraId: 'cam-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    cattleCount: 15,
    healthScore: 94,
    identifiedIssues: [],
    recommendations: ['Manter rotina'],
    rawAnalysis: 'Rebanho em comportamento normal de pastejo. Sem sinais visuais de estresse.',
  },
  {
    id: 'seed-2',
    cameraId: 'cam-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    cattleCount: 14,
    healthScore: 88,
    identifiedIssues: [
      {
        issue: 'Leve agitação',
        description: 'Um animal apresenta movimentação de cabeça repetitiva e deslocamento frequente sem pastejo.',
        possibleCauses: ['Estresse térmico leve', 'Presença de insetos', 'Início de desconforto físico'],
      },
    ],
    recommendations: ['Observar animal isolado'],
    rawAnalysis: 'A maioria do gado está calma, mas um animal apresenta movimentação excessiva.',
  },
  {
    id: 'seed-3',
    cameraId: 'cam-02',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    cattleCount: 8,
    healthScore: 91,
    identifiedIssues: [],
    recommendations: [],
    rawAnalysis: 'Animais bebendo água regularmente.',
  },
];

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = { history: createDefaultHistory() };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

export const readStore = async () => {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');

  try {
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch (error) {
    logger.warn('Falha ao interpretar storage, reiniciando arquivo.', { error: error?.message });
    return { history: [] };
  }
};

export const writeStore = async (data) => {
  await ensureStore();
  const payload = {
    history: Array.isArray(data.history) ? data.history : [],
  };

  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(payload, null, 2));
  await fs.rename(tempFile, DATA_FILE);
};

export const updateStore = async (mutator) => {
  writeQueue = writeQueue.then(async () => {
    const current = await readStore();
    const next = (await mutator(current)) || current;
    await writeStore(next);
    return next;
  });

  return writeQueue;
};
