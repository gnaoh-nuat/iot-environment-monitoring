const { Sequelize } = require("sequelize");

const dbLogging = process.env.DB_LOGGING === "true";
const requiredDbVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

const missingDbVars = requiredDbVars.filter((key) => !process.env[key]);
if (missingDbVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingDbVars.join(", ")}`,
  );
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: dbLogging ? console.log : false,
    retry: {
      max: 3,
    },
  },
);

module.exports = sequelize;
