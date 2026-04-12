const cron = require("node-cron");
const { Op } = require("sequelize");
const DataSensor = require("../models/SensorData");

// chạy mỗi ngày lúc 00:00
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("[CRON] Running cleanup job...");

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const deleted = await DataSensor.destroy({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    console.log(`[CRON] Deleted ${deleted} old records`);
  } catch (err) {
    console.error("[CRON] Error:", err);
  }
});
