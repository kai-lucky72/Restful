const config = require('./config');
const { createApp, db, logger } = require('@fes/shared');
const { sequelize } = require('./models/notification.model');
const mountRoutes = require('./routes/notification.routes');

const app = createApp({
  serviceName: config.serviceName,
  title: 'Notification Service',
  apiPrefix: '/api/v1/notifications',
  mountRoutes,
  swaggerApis: [__dirname + '/routes/*.js'],
});

async function start() {
  try {
    await db.initSchema(sequelize, config.schema);
    app.listen(config.port, () => {
      logger.info('Notification service started', { port: config.port });
      // eslint-disable-next-line no-console
      console.log(`  notification-service -> http://localhost:${config.port}  (docs: /api-docs)`);
    });
  } catch (err) {
    logger.error('Notification service failed to start', { message: err.message });
    process.exit(1);
  }
}

process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
start();
