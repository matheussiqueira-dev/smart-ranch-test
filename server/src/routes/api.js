import express from 'express';
import crypto from 'crypto';
import { readStore, updateStore } from '../storage.js';
import config from '../config.js';
import { runVisionAnalysis } from '../services/vision.js';
import { clamp, isValidBase64, normalizeBase64 } from '../utils/validation.js';

const router = express.Router();

const buildResult = ({ normalized, cameraId }) => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  cameraId,
  cattleCount: normalized.cattleCount || 0,
  identifiedIssues: normalized.identifiedIssues || [],
  healthScore: normalized.healthScore || 0,
  recommendations: normalized.recommendations || [],
  rawAnalysis: normalized.summary || 'Análise concluída.',
});

router.get('/history', async (req, res, next) => {
  try {
    const { cameraId } = req.query;
    const limit = clamp(Number.parseInt(req.query.limit || '200', 10), 1, config.historyMax);
    const offset = Math.max(Number.parseInt(req.query.offset || '0', 10), 0);

    const store = await readStore();
    let history = store.history;

    if (cameraId) {
      history = history.filter((item) => item.cameraId === cameraId);
    }

    const total = history.length;
    const page = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);

    res.json({ history: page, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

router.get('/history/:id', async (req, res, next) => {
  try {
    const store = await readStore();
    const item = store.history.find((entry) => entry.id === req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Registro não encontrado.' });
    }
    return res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const store = await readStore();
    const history = store.history;

    const total = history.length;
    const avgScore = total
      ? Math.round(history.reduce((acc, curr) => acc + (curr.healthScore || 0), 0) / total)
      : 0;
    const critical = history.filter((item) => item.healthScore <= 60).length;

    res.json({
      total,
      avgScore,
      critical,
      lastUpdate: history[0]?.timestamp || null,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/analyze', async (req, res, next) => {
  try {
    const { base64Image, cameraId } = req.body || {};

    const normalizedImage = normalizeBase64(base64Image);
    if (!normalizedImage) {
      return res.status(400).json({ message: 'Imagem não enviada.' });
    }

    const maxBytes = config.requestLimitMb * 1024 * 1024;
    if (!isValidBase64(normalizedImage, maxBytes)) {
      return res.status(400).json({ message: 'Imagem inválida ou muito grande.' });
    }

    const providerResult = await runVisionAnalysis(normalizedImage);
    const result = buildResult({ normalized: providerResult || {}, cameraId });

    await updateStore((store) => {
      const history = [result, ...(store.history || [])];
      return { history: history.slice(0, config.historyMax) };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
