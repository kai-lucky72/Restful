const config = require('./config');
const { createApp, logger } = require('@fes/shared');
const { sequelize } = require('./models/user.model');
const { AuditLog } = require('./models/auditLog.model');
const mountRoutes = require('./routes/user.routes');
const mountAuditRoutes = require('./routes/audit.routes');

const app = createApp({
  serviceName: config.serviceName,
  title: 'User Management Service',
  apiPrefix: '/api/v1/users',
  mountRoutes,
  swaggerApis: [__dirname + '/routes/*.js'],
  extraMounts: [{ prefix: '/api/v1/audit-logs', mount: mountAuditRoutes }],
});

async function start() {
  try {
    await sequelize.authenticate(); // auth-service owns the users table
    // user-service owns the audit_logs table within the shared auth schema.
    await AuditLog.sync({ alter: true });
    app.listen(config.port, () => {
      logger.info('User service started', { port: config.port });
      // eslint-disable-next-line no-console
      console.log(`  user-service  -> http://localhost:${config.port}  (docs: /api-docs)`);
    });
  } catch (err) {
    logger.error('User service failed to start', { message: err.message });
    process.exit(1);
  }
}

process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
start();
