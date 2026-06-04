const path = require('path');
// Load the shared root .env (works locally; in Docker, env comes from compose).
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

process.env.SERVICE_NAME = 'auth-service';
process.env.PORT = process.env.AUTH_PORT || '4001';

module.exports = {
  serviceName: 'auth-service',
  port: parseInt(process.env.PORT, 10),
  schema: 'auth',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  mail: {
    mode: process.env.MAIL_MODE || 'simulated',
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    frontendUrl: process.env.FRONTEND_URL || (process.env.CORS_ORIGINS || '').split(',')[0] || 'http://localhost:5173',
  },
};
