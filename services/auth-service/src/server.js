const config = require('./config');
const { createApp, db, logger } = require('@fes/shared');
const { sequelize } = require('./models/user.model');
require('./models/refreshToken.model');
const mountRoutes = require('./routes/auth.routes');

const app = createApp({
  serviceName: config.serviceName,
  title: 'Auth Service',
  apiPrefix: '/api/v1/auth',
  mountRoutes,
  swaggerApis: [__dirname + '/routes/*.js'],
});

async function start() {
  try {
    await db.initSchema(sequelize, config.schema);
    app.listen(config.port, () => {
      logger.info('Auth service started', { port: config.port });
      // eslint-disable-next-line no-console
      console.log(`  auth-service  → http://localhost:${config.port}  (docs: /api-docs)`);
    });
  } catch (err) {
    logger.error('Auth service failed to start', { message: err.message });
    process.exit(1);
  }
}

process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
start();
