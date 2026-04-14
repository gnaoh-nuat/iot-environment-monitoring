const Device = require("../models/Device");
const Action = require("../models/ActionHistory");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");
const AppError = require("../utils/appError");

const SENSOR_NAMES = ["temperature", "humidity", "light"];

/**
 * getDashboardInit: Fetch snapshot of all devices, latest actions, and sensor histories
 * Runs parallel queries for optimal performance
 */
const getDashboardInit = async (req, res, next) => {
  try {
    const { historyLimit = 10 } = req.query;
    const parsedLimit =
      Number.parseInt(historyLimit, 10) > 0
        ? Number.parseInt(historyLimit, 10)
        : 10;
    const safeLimit = Math.min(parsedLimit, 50); // Cap at 50 to prevent abuse

    const snapshotAt = new Date().toISOString();

    // ===== PARALLEL QUERIES =====
    const [devices, allActions, ...sensorHistories] = await Promise.all([
      // 1. Get all devices
      Device.findAll({
        order: [["createdAt", "ASC"]],
      }),

      // 2. Get latest action per device (recent first)
      Action.findAll({
        order: [["createdAt", "DESC"]],
      }),

      // 3-5. Get sensor histories (parallel)
      ...SENSOR_NAMES.map((sensorName) =>
        (async () => {
          const sensor = await Sensor.findOne({ where: { name: sensorName } });
          if (!sensor) {
            return { sensorName, rows: [] };
          }

          const rows = await DataSensor.findAll({
            where: { sensorId: sensor.id },
            order: [["createdAt", "DESC"]],
            limit: safeLimit,
          });

          return { sensorName, rows: rows.reverse() };
        })(),
      ),
    ]);

    // ===== BUILD LATEST ACTIONS MAP =====
    const latestActionByDeviceId = {};
    allActions.forEach((action) => {
      const deviceKey = String(action.deviceId);
      if (!latestActionByDeviceId[deviceKey]) {
        latestActionByDeviceId[deviceKey] = action;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        devices,
        latestActionByDeviceId,
        sensorHistories,
        snapshotAt,
      },
      message: "Dashboard snapshot loaded",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardInit,
};
