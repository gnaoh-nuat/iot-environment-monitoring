const Device = require("../models/Device");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");

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
    const [devicesWithLatestAction, ...sensorHistories] = await Promise.all([
      // 1. Get all devices
      Device.findAll({
        order: [["createdAt", "ASC"]],
        include: [
          {
            association: "actionLogs",
            attributes: [
              "id",
              "deviceId",
              "action",
              "status",
              "createdAt",
              "updatedAt",
            ],
            separate: true,
            limit: 1,
            order: [["createdAt", "DESC"]],
          },
        ],
      }),

      // 2-4. Get sensor histories (parallel)
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
    const devices = devicesWithLatestAction.map((device) => {
      const plainDevice = device.get({ plain: true });
      const latestAction =
        Array.isArray(plainDevice.actionLogs) &&
        plainDevice.actionLogs.length > 0
          ? plainDevice.actionLogs[0]
          : null;

      if (latestAction) {
        latestActionByDeviceId[String(plainDevice.id)] = latestAction;
      }

      delete plainDevice.actionLogs;
      return plainDevice;
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
