// Structured logger. Writes JSON lines to console and (optionally) a file.
const fs = require('fs');
const path = require('path');

const SERVICE = process.env.SERVICE_NAME || 'service';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

let fileStream = null;
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  fileStream = fs.createWriteStream(path.join(LOG_DIR, `${SERVICE}.log`), { flags: 'a' });
} catch (_) {
  // If the filesystem is read-only, fall back to console only.
}

function write(level, message, meta = {}) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), service: SERVICE, level, message, ...meta });
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](entry);
  if (fileStream) fileStream.write(entry + '\n');
}

module.exports = {
  info: (m, meta) => write('info', m, meta),
  warn: (m, meta) => write('warn', m, meta),
  error: (m, meta) => write('error', m, meta),
};
