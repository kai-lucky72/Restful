const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

process.env.SERVICE_NAME = 'notification-service';
process.env.PORT = process.env.NOTIFICATION_PORT || '4006';

module.exports = {
  serviceName: 'notification-service',
  port: parseInt(process.env.PORT, 10),
  schema: 'notification',
};
