const { Op } = require("sequelize");
const { Device } = require("../../models");

const buildDeviceSyncPayload = async () => {
  // 1. Tối ưu: Lấy Device kèm theo đúng 1 Action hợp lệ (ON/OFF) mới nhất
  const devices = await Device.findAll({
    order: [["createdAt", "ASC"]],
    include: [
      {
        association: "actionLogs",
        attributes: ["status"],
        where: { status: { [Op.in]: ["ON", "OFF"] } },
        required: false, // LEFT JOIN để vẫn lấy được thiết bị chưa có action nào
        separate: true, // Chạy query riêng rẽ giúp áp dụng được limit an toàn
        limit: 1,
        order: [["createdAt", "DESC"]],
      },
    ],
  });

  // 2. Tối ưu: Lược bỏ hoàn toàn vòng lặp Map thủ công
  return {
    devices: devices.map((d) => ({
      id: d.id,
      // Dùng Optional Chaining để đọc thẳng trạng thái mới nhất từ include, mặc định "OFF"
      state: d.actionLogs?.[0]?.status || "OFF",
    })),
    timestamp: new Date().toISOString(),
  };
};

const handleSyncRequest = async (mqttClient, syncResTopic) => {
  const payload = await buildDeviceSyncPayload();

  // 3. Callback MQTT viết gọn trên 1 dòng if-else
  mqttClient.publish(
    syncResTopic,
    JSON.stringify(payload),
    { qos: 1 },
    (err) => {
      if (err) console.error("[MQTT] Publish sync response error:", err);
      else console.log(`[MQTT] Sync response sent to ${syncResTopic}`, payload);
    },
  );
};

module.exports = {
  handleSyncRequest,
};
