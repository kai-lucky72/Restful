const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const requestId = require('./middleware/requestId.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

/**
 * Build a fully wired Express app with the standards baked in:
 * helmet, CORS, JSON parsing, request IDs, request logging, Swagger, and the
 * global 404 + error handlers. Each service just supplies its routes + meta.
 *
 * @param {object} opts
 * @param {string} opts.serviceName
 * @param {string} opts.title          Swagger title
 * @param {string} opts.apiPrefix      e.g. '/api/v1/auth'
 * @param {Function} opts.mountRoutes  (router) => void  — attach service routes
 * @param {string[]} opts.swaggerApis  glob(s) of files with @swagger JSDoc
 */
function createApp(opts) {
  const { serviceName, title, apiPrefix, mountRoutes, swaggerApis = [], extraMounts = [] } = opts;
  const app = express();

  // CORS: explicit allowed origins (standards 06 §11).
  const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5000')
    .split(',')
    .map((s) => s.trim());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin(origin, cb) {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);
  app.use(morgan(':method :url :status :response-time ms - req::res[x-request-id]'));

  // Health check (standards 06 §13).
  app.get('/health', (req, res) =>
    res.json({ success: true, service: serviceName, message: 'healthy', uptime: process.uptime() })
  );

  // Swagger per service.
  const spec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title, version: '1.0.0', description: `${title} — Fire Extinguisher Management System` },
      servers: [{ url: process.env.SERVICE_PUBLIC_URL || `http://localhost:${process.env.PORT}${apiPrefix}` }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
      security: [{ bearerAuth: [] }],
    },
    apis: swaggerApis,
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api-docs.json', (req, res) => res.json(spec));

  // Service routes.
  const router = express.Router();
  mountRoutes(router);
  app.use(apiPrefix, router);

  // Optional additional routers mounted at their own prefixes (same service/port).
  extraMounts.forEach(({ prefix, mount }) => {
    const r = express.Router();
    mount(r);
    app.use(prefix, r);
  });

  // 404 + error handler last.
  app.use(notFound);
  app.use(errorHandler);

  app.set('logger', logger);
  return app;
}

module.exports = createApp;
