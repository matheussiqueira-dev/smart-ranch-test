const formatMeta = (meta) => {
  if (!meta) return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return '';
  }
};

const log = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] ${level.toUpperCase()}: ${message}${formatMeta(meta)}`;
  if (level === 'error') {
    console.error(output);
    return;
  }
  if (level === 'warn') {
    console.warn(output);
    return;
  }
  console.log(output);
};

export const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
