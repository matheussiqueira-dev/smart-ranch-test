export const normalizeBase64 = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  if (value.includes(',')) {
    return value.split(',')[1];
  }
  return value;
};

export const isValidBase64 = (value, maxBytes) => {
  if (!value) return false;
  const bytes = Math.ceil((value.length * 3) / 4);
  if (bytes > maxBytes) return false;
  return /^[A-Za-z0-9+/=]+$/.test(value);
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
