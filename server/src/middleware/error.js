import { logger } from '../logger.js';

export const errorHandler = (err, req, res, _next) => {
  const status = err?.statusCode || 500;
  const message = err?.message || 'Erro inesperado.';

  logger.error('Erro na requisição', {
    requestId: req.id,
    status,
    message,
  });

  res.status(status).json({
    message,
    requestId: req.id,
  });
};
