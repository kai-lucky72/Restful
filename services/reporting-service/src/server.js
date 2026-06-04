const config = require('./config');
const { createApp, logger } = require('@fes/shared');
const { extSeq, inspSeq, authSeq } = require('./models');
const mountRoutes = require('./routes/reporting.routes');

const app = createApp({
  serviceName: config.serviceName,
  title: 'Reporting Service',
  apiPrefix: '/api/v1/reports',
  mountRoutes,
  swaggerApis: [__dirname + '/routes/*.js'],
});

async function start() {
  try {
    await Promise.all([extSeq.authenticate(), inspSeq.authenticate(), authSeq.authenticate()]);
    app.listen(config.port, () => {
      logger.info('Reporting service started', { port: config.port });
      // eslint-disable-next-line no-console
      console.log(`  reporting-service -> http://localhost:${config.port}  (docs: /api-docs)`);
    });
  } catch (err) {
    logger.error('Reporting service failed to start', { message: err.message });
    process.exit(1);
  }
}

process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
start();
