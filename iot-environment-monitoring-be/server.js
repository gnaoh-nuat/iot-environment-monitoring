require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const swaggerUi = require("swagger-ui-express");

const sequelize = require("./config/database");
const swaggerSpecs = require("./config/swagger");
const rootRouter = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { initializeAssociations } = require("./models");
const { startCleanupDataSensorJob } = require("./cron/cleanupDataSensor");
const { initSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// ===== 1. MIDDLEWARES & DOCS =====
app.use(cors()); // Tối ưu: Dùng mặc định của cors đã bao gồm origin: "*" và các method cơ bản
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.get("/", (req, res) => res.redirect("/api-docs"));

// ===== 2. INIT SERVICES =====
initSocket(server);
require("./mqtt/mqttClient"); // Kích hoạt kết nối MQTT

// ===== 3. BOOTSTRAP APP =====
const startServer = async () => {
  try {
    initializeAssociations();

    // Khởi tạo và đồng bộ Database
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("[DB] Connected & Schema synchronized successfully.");

    // Chạy cron job dọn dẹp
    startCleanupDataSensorJob();

    // Mount Routes & Error Handler sau khi DB đã sẵn sàng
    app.use(rootRouter);
    app.use(errorHandler);

    server.listen(PORT, () => {
      console.log(`🚀 API Docs: http://localhost:${PORT}/api-docs`);
      console.log("⚡ SERVER IS READY TO HANDLE REQUESTS!");
    });
  } catch (error) {
    console.error("[FATAL] Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
