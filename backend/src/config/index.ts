import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://state_admin:StateLL2024!@localhost:5432/state_lessons',
  },
  auth: {
    mode: (process.env.AUTH_MODE || 'local') as 'azure' | 'local',
    azure: {
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:4000/auth/callback',
    },
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    tokenExpiry: process.env.TOKEN_EXPIRY || '8h',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};
