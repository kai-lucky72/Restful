const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

process.env.SERVICE_NAME = 'reporting-service';
process.env.PORT = process.env.REPORTING_PORT || '4005';

module.exports = {
  serviceName: 'reporting-service',
  port: parseInt(process.env.PORT, 10),
};
