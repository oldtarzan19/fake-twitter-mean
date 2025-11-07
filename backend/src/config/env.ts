import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toArray = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/fake_twitter',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev_secret_change_me',
  corsOrigins: toArray(process.env.CORS_ORIGINS),
};

if (env.corsOrigins.length === 0) {
  env.corsOrigins = ['http://localhost:4200'];
}

export const isProduction = env.nodeEnv === 'production';
