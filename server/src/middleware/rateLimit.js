const buckets = new Map();

export const rateLimit = ({ windowMs, max }) => (req, res, next) => {
  const key = req.ip || 'global';
  const now = Date.now();
  const entry = buckets.get(key) || { count: 0, reset: now + windowMs };

  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }

  entry.count += 1;
  buckets.set(key, entry);

  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.floor(entry.reset / 1000));

  if (entry.count > max) {
    return res.status(429).json({ message: 'Muitas requisições. Tente novamente em instantes.' });
  }

  return next();
};
