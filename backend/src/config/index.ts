import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Guard: Ensure JWT_SECRET is set in production
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev_jwt_secret_change_in_production');
if (isProduction && !process.env.JWT_SECRET) {
  console.warn('[Security Warning] JWT_SECRET environment variable is not set in production. Please configure a strong random secret.');
}

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: jwtSecret || 'dev_fallback_secret_local_only',
  databaseUrl: process.env.DATABASE_URL || '',
  isProduction,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@gumshop.online',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};

