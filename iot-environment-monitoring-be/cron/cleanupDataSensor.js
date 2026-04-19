const cron = require("node-cron");
const { Op } = require("sequelize");
const DataSensor = require("../models/SensorData");

const DEFAULT_CRON_EXPRESSION = "0 0 * * *";
const DEFAULT_RETENTION_DAYS = 1;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const startCleanupDataSensorJob = () => {
  const isEnabled =
    String(
      process.env.ENABLE_SENSOR_DATA_CLEANUP_CRON || "true",
    ).toLowerCase() !== "false";

  if (!isEnabled) {
    console.log(
      "[CRON] Data sensor cleanup disabled (ENABLE_SENSOR_DATA_CLEANUP_CRON=false)",
    );
    return null;
  }

  const cronExpression =
    process.env.DATA_SENSOR_CLEANUP_CRON || DEFAULT_CRON_EXPRESSION;
  const retentionDays = parsePositiveInt(
    process.env.DATA_SENSOR_RETENTION_DAYS,
    DEFAULT_RETENTION_DAYS,
  );

  const task = cron.schedule(cronExpression, async () => {
    try {
      console.log("[CRON] Running cleanup job...");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deleted = await DataSensor.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      console.log(
        `[CRON] Deleted ${deleted} old records older than ${retentionDays} day(s)`,
      );
    } catch (err) {
      console.error("[CRON] Error:", err);
    }
  });

  console.log(
    `[CRON] Data sensor cleanup scheduled at "${cronExpression}" (retention ${retentionDays} day(s))`,
  );

  return task;
};

module.exports = {
  startCleanupDataSensorJob,
};
