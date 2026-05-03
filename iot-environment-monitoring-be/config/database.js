const { Sequelize } = require("sequelize");

// 1. Phân rã biến môi trường và đặt giá trị mặc định cho PORT trực tiếp
const {
  DB_HOST,
  DB_PORT = 5432,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_LOGGING,
} = process.env;

// 2. Kiểm tra fail-fast ngắn gọn
const missingVars = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"].filter(
  (key) => !process.env[key],
);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required database env vars: ${missingVars.join(", ")}`,
  );
}

// 3. Khởi tạo Sequelize với các biến đã được phân rã cho dễ đọc
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: "postgres",
  logging: DB_LOGGING === "true" ? console.log : false,
  retry: { max: 3 },
});

module.exports = sequelize;
