const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

process.env.SERVICE_NAME = 'inspection-service';
process.env.PORT = process.env.INSPECTION_PORT || '4004';

module.exports = {
  serviceName: 'inspection-service',
  port: parseInt(process.env.PORT, 10),
  schema: 'inspection',
};
