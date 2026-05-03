const cron = require("node-cron");
const { Op } = require("sequelize");
const { DataSensor } = require("../models");

const startCleanupDataSensorJob = () => {
  // 1. Tối ưu: Chỉ cần check nếu explicitly set là "false"
  if (process.env.ENABLE_SENSOR_DATA_CLEANUP_CRON === "false") {
    console.log("[CRON] Data sensor cleanup disabled.");
    return null;
  }

  // 2. Tối ưu: Inline fallback, bỏ helper parsePositiveInt và các hằng số thừa
  const cronExpression = process.env.DATA_SENSOR_CLEANUP_CRON || "0 0 * * *";
  const retentionDays = Math.max(
    1,
    Number(process.env.DATA_SENSOR_RETENTION_DAYS) || 1,
  );

  const task = cron.schedule(cronExpression, async () => {
    try {
      console.log("[CRON] Running cleanup job...");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await DataSensor.destroy({
        where: {
          createdAt: { [Op.lt]: cutoffDate },
        },
      });

      console.log(
        `[CRON] Deleted ${deletedCount} records older than ${retentionDays} day(s)`,
      );
    } catch (err) {
      console.error("[CRON] Error:", err);
    }
  });

  console.log(
    `[CRON] Scheduled at "${cronExpression}" (retention: ${retentionDays} day(s))`,
  );
  return task;
};

module.exports = {
  startCleanupDataSensorJob,
};
