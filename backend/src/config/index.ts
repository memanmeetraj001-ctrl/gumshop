import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Guard: Ensure secure JWT_SECRET in production
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    console.warn('[Security Warning] JWT_SECRET environment variable is not set. Generating an ephemeral 256-bit cryptographic secret for this runtime session.');
    jwtSecret = crypto.randomBytes(32).toString('hex');
  } else {
    jwtSecret = 'dev_jwt_secret_local_development_only';
  }
}

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret,
  databaseUrl: process.env.DATABASE_URL || '',
  isProduction,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@gumshop.online',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
