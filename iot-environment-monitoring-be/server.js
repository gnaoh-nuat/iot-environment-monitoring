const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { sequelize, Sensor, Device } = require("./models");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const actionHistoryRoutes = require("./routes/actionHistoryRoutes");

const app = express();
const port = Number(process.env.PORT) || 5000;

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      success: true,
      service: "iot-environment-monitoring-be",
      database: "connected",
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: "iot-environment-monitoring-be",
      database: "disconnected",
      message: error.message,
    });
  }
});

app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/actions", actionHistoryRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const seedBaseData = async () => {
  const sensorCount = await Sensor.count();
  if (sensorCount === 0) {
    await Sensor.bulkCreate([
      { name: "Nhiệt độ" },
      { name: "Độ ẩm" },
      { name: "Ánh sáng" },
    ]);
  }

  const deviceCount = await Device.count();
  if (deviceCount === 0) {
    await Device.bulkCreate([
      { name: "Quạt thông gió" },
      { name: "Đèn LED" },
      { name: "Máy bơm nước" },
    ]);
  }
};

const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await seedBaseData();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await sequelize.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await sequelize.close();
  process.exit(0);
});

bootstrap();
