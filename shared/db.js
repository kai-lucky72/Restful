const { Sequelize, DataTypes, Op } = require('sequelize');

/**
 * Create a Sequelize instance scoped to a service's own schema in the shared
 * Postgres database. Each microservice owns one schema (auth, extinguisher, ...).
 * Note: sequelize is resolved from the calling service's node_modules.
 */
function createSequelize(schema) {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      logging: false,
      define: { schema, timestamps: true }, // createdAt / updatedAt on every model
    }
  );
  return sequelize;
}

// Ensure the schema exists before syncing models into it.
async function initSchema(sequelize, schema) {
  await sequelize.authenticate();
  await sequelize.createSchema(schema, {}).catch((e) => {
    if (!String(e.message).includes('already exists')) throw e;
  });
  await sequelize.sync({ alter: true });
}

module.exports = { createSequelize, initSchema, Sequelize, DataTypes, Op };
