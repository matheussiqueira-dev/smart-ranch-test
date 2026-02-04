import crypto from 'crypto';
import cors from 'cors';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import config from './config.js';
import { logger } from './logger.js';
import { requireApiKey } from './middleware/auth.js';
import { rateLimit } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/error.js';
import apiRoutes from './routes/api.js';

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(
  cors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  })
);

app.use(express.json({ limit: `${config.requestLimitMb}mb` }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      id: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', requireApiKey, rateLimit({ windowMs: 60_000, max: 120 }), apiRoutes);
app.use('/api/v1', requireApiKey, rateLimit({ windowMs: 60_000, max: 120 }), apiRoutes);

app.use(errorHandler);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/voice' });

const safeSend = (ws, payload) => {
  if (ws.readyState === ws.OPEN) {
    ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }
};

wss.on('connection', (clientSocket, req) => {
  if (!config.aiVoiceWsUrl) {
    safeSend(clientSocket, { type: 'error', message: 'Relay de voz não configurado no backend.' });
    clientSocket.close();
    return;
  }

  if (config.apiAccessKey) {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (token !== config.apiAccessKey) {
      safeSend(clientSocket, { type: 'error', message: 'Token inválido para relay.' });
      clientSocket.close();
      return;
    }
  }

  const upstream = new WebSocket(config.aiVoiceWsUrl, {
    headers: config.aiApiKey ? { Authorization: `Bearer ${config.aiApiKey}` } : undefined,
  });

  upstream.on('open', () => {
    if (config.aiVoiceInitPayload) {
      try {
        upstream.send(config.aiVoiceInitPayload);
      } catch (error) {
        logger.warn('Falha ao enviar payload inicial para relay upstream.', { error: error?.message });
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
    logger.error('Erro no relay upstream de voz', { error: error?.message });
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

server.listen(config.port, () => {
  logger.info('Servidor iniciado', { port: config.port });
});
