import dotenv from 'dotenv';

dotenv.config();

const parseList = (value) =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const config = {
  port: toInt(process.env.PORT || '5174', 5174),
  apiAccessKey: process.env.API_ACCESS_KEY || '',
  aiApiKey: process.env.AI_API_KEY || '',
  aiVisionUrl: process.env.AI_VISION_URL || '',
  aiVoiceWsUrl: process.env.AI_VOICE_WS_URL || '',
  aiVoiceInitPayload: process.env.AI_VOICE_INIT_PAYLOAD || '',
  corsOrigins: parseList(process.env.CORS_ORIGINS || ''),
  historyMax: toInt(process.env.HISTORY_MAX || '500', 500),
  requestLimitMb: toInt(process.env.REQUEST_LIMIT_MB || '20', 20),
};

export default config;
