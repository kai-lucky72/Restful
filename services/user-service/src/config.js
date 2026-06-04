const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

process.env.SERVICE_NAME = 'user-service';
process.env.PORT = process.env.USER_PORT || '4002';

module.exports = {
  serviceName: 'user-service',
  port: parseInt(process.env.PORT, 10),
  schema: 'auth', // shares the identity schema owned by auth-service
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
};
