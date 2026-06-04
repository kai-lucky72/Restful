const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

process.env.SERVICE_NAME = 'extinguisher-service';
process.env.PORT = process.env.EXTINGUISHER_PORT || '4003';

module.exports = {
  serviceName: 'extinguisher-service',
  port: parseInt(process.env.PORT, 10),
  schema: 'extinguisher',
};
