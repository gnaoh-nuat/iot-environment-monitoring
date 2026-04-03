const { Sequelize } = require("sequelize");

const dbLogging = process.env.DB_LOGGING === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: dbLogging ? console.log : false,
  },
);

module.exports = sequelize;
