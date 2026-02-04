import config from '../config.js';

export const requireApiKey = (req, res, next) => {
  if (!config.apiAccessKey) {
    return next();
  }

  const key = req.header('x-api-key');
  if (key !== config.apiAccessKey) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  return next();
};
