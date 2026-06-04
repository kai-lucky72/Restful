const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const { apiResponse, logger, requestId } = require('@fes/shared');

const app = express();
const port = parseInt(process.env.GATEWAY_PORT || '5000', 10);

const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5173')
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
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(morgan(':method :url :status :response-time ms - req::res[x-request-id]'));

const URLS = {
  auth: process.env.AUTH_URL || 'http://localhost:4001',
  users: process.env.USER_URL || 'http://localhost:4002',
  extinguishers: process.env.EXTINGUISHER_URL || 'http://localhost:4003',
  inspections: process.env.INSPECTION_URL || 'http://localhost:4004',
  reports: process.env.REPORTING_URL || 'http://localhost:4005',
  notifications: process.env.NOTIFICATION_URL || 'http://localhost:4006',
};

// Map gateway path segments → upstream service. /requests and /audit-logs are
// served by the extinguisher and user services respectively (contract §8).
const services = {
  ...URLS,
  requests: URLS.extinguishers,
  'audit-logs': URLS.users,
};

const gatewaySpec = {
  openapi: '3.0.0',
  info: {
    title: 'TZW Fire Extinguisher Management API Gateway',
    version: '1.0.0',
    description: 'Single RESTful entrypoint for auth, users, extinguishers, inspections, reports, and notifications.',
  },
  servers: [{ url: `http://localhost:${port}/api/v1` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/auth/*': { get: { summary: 'Forwarded to Auth Service', tags: ['Gateway'] } },
    '/users/*': { get: { summary: 'Forwarded to User Service', tags: ['Gateway'] } },
    '/audit-logs/*': { get: { summary: 'Forwarded to User Service (audit)', tags: ['Gateway'] } },
    '/extinguishers/*': { get: { summary: 'Forwarded to Extinguisher Service', tags: ['Gateway'] } },
    '/requests/*': { get: { summary: 'Forwarded to Extinguisher Service (requests)', tags: ['Gateway'] } },
    '/inspections/*': { get: { summary: 'Forwarded to Inspection Service', tags: ['Gateway'] } },
    '/reports/*': { get: { summary: 'Forwarded to Reporting Service', tags: ['Gateway'] } },
    '/notifications/*': { get: { summary: 'Forwarded to Notification Service', tags: ['Gateway'] } },
  },
  tags: [{ name: 'Gateway', description: 'Routes are proxied to service-level Swagger docs listed below.' }],
};

app.get('/health', (req, res) => apiResponse.success(res, {
  message: 'Gateway healthy.',
  data: { service: 'api-gateway', uptime: process.uptime(), services },
}));

app.get('/api/v1/health', (req, res) => apiResponse.success(res, {
  message: 'Gateway healthy.',
  data: { service: 'api-gateway', uptime: process.uptime(), services },
}));

app.get('/api-docs.json', (req, res) => res.json(gatewaySpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(gatewaySpec, {
  customSiteTitle: 'TZW API Gateway Docs',
  customCss: '.swagger-ui .topbar{display:none}',
}));

function docsPage() {
  const links = Object.entries(URLS)
    .map(([name, url]) => `<li><a href="${url}/api-docs" target="_blank">${name} service docs</a> &middot; <a href="${url}/api-docs.json" target="_blank">json</a></li>`)
    .join('');
  return `<!doctype html><html><head><title>TZW API Docs</title>
    <style>body{font-family:Inter,system-ui,sans-serif;max-width:640px;margin:40px auto;color:#1f2937}
    h1{color:#dc2626}a{color:#b91c1c;text-decoration:none}a:hover{text-decoration:underline}li{margin:8px 0}</style>
    </head><body><h1>TZW Fire Safety — API Docs</h1>
    <p>Gateway base: <code>http://localhost:${port}/api/v1</code></p>
    <p><a href="/api-docs">Combined gateway docs</a></p>
    <h3>Per-service Swagger</h3><ul>${links}</ul></body></html>`;
}
app.get('/docs', (req, res) => res.type('html').send(docsPage()));
app.get('/', (req, res) => res.type('html').send(docsPage()));

function proxy(serviceName) {
  return async (req, res) => {
    const target = services[serviceName];
    const url = `${target}${req.originalUrl}`;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    try {
      const response = await axios({
        method: req.method,
        url,
        data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
        headers,
        responseType: 'arraybuffer',
        validateStatus: () => true,
        timeout: 15000,
      });

      Object.entries(response.headers).forEach(([key, value]) => {
        if (!['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.status(response.status).send(response.data);
    } catch (err) {
      logger.error('Gateway proxy failed', { serviceName, message: err.message });
      apiResponse.error(res, {
        statusCode: 502,
        message: `${serviceName} service is unavailable.`,
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  };
}

app.use('/api/v1/auth', proxy('auth'));
app.use('/api/v1/users', proxy('users'));
app.use('/api/v1/audit-logs', proxy('audit-logs'));
app.use('/api/v1/extinguishers', proxy('extinguishers'));
app.use('/api/v1/requests', proxy('requests'));
app.use('/api/v1/inspections', proxy('inspections'));
app.use('/api/v1/reports', proxy('reports'));
app.use('/api/v1/notifications', proxy('notifications'));

app.use((err, req, res, next) => {
  if (!err) return next();

  logger.error('Gateway request error', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });

  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return apiResponse.error(res, {
      statusCode: 400,
      message: 'Invalid JSON payload.',
      code: 'INVALID_JSON',
    });
  }

  return apiResponse.error(res, {
    statusCode: 500,
    message: 'Something went wrong. Please try again later.',
    code: 'SERVER_ERROR',
  });
});

app.use((req, res) => apiResponse.error(res, {
  statusCode: 404,
  message: `Route ${req.method} ${req.originalUrl} not found`,
  code: 'NOT_FOUND',
}));

app.listen(port, () => {
  logger.info('API gateway started', { port });
  // eslint-disable-next-line no-console
  console.log(`  api-gateway -> http://localhost:${port}  (docs: /api-docs)`);
});
