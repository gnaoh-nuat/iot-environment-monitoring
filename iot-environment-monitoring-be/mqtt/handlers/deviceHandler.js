const { Op } = require("sequelize");
const { ActionHistory: Action } = require("../../models");
const { emitSensorData } = require("../../socket/socketHandler");
const { clearActionTimeout } = require("../../services/deviceControlTracker");

const socketDeviceTopic = process.env.SOCKET_DEVICE_TOPIC || "device-status";

// 1. Tối ưu: Đơn giản hóa hàm check thành công, bỏ switch/case dài dòng
const isSuccessStatus = (status) =>
  ["DONE", "SUCCESS", "OK"].includes(String(status).toUpperCase());

const notifyDeviceStatus = (
  actionId,
  status,
  targetState,
  error = null,
  extra = {},
) => {
  emitSensorData(socketDeviceTopic, {
    actionId: Number(actionId),
    status,
    targetState,
    error,
    timestamp: new Date().toISOString(),
    ...extra,
  });
};

const handleDeviceAck = async (data) => {
  const {
    actionId,
    status,
    error,
    timestamp = new Date().toISOString(),
  } = data;

  if (!actionId || !status) {
    return console.warn(`[MQTT] Invalid device status payload:`, data);
  }

  // 2. Tối ưu: Truyền thẳng actionId, Sequelize tự xử lý type
  const action = await Action.findByPk(actionId);

  if (!action) {
    console.log(
      `[SOCKET] WARN: ACK received with unknown actionId ${actionId}`,
    );
    return notifyDeviceStatus(actionId, "FAILED", "OFF", "Unknown actionId");
  }

  // Bỏ qua nếu action đã được xử lý (không phải PENDING/LOADING)
  if (!["PENDING", "LOADING"].includes(action.status)) {
    return notifyDeviceStatus(actionId, action.status, action.status, null, {
      stale: true,
      deviceId: action.deviceId,
      timestamp,
    });
  }

  clearActionTimeout(action.id);

  // LUỒNG THÀNH CÔNG
  if (isSuccessStatus(status)) {
    const targetAction = action.action; // "ON" hoặc "OFF"
    await action.update({ status: targetAction });

    console.log(
      `[DB] Updated ACTION ID ${action.id}: PENDING -> ${targetAction}`,
    );
    return notifyDeviceStatus(action.id, targetAction, targetAction, null, {
      deviceId: action.deviceId,
      timestamp,
    });
  }

  // LUỒNG THẤT BẠI: Hoàn tác về trạng thái ON/OFF hợp lệ gần nhất
  const previousAction = await Action.findOne({
    where: { deviceId: action.deviceId, status: { [Op.in]: ["ON", "OFF"] } },
    order: [["createdAt", "DESC"]],
  });

  const revertedStatus = previousAction?.status || "OFF";
  await action.update({ status: revertedStatus });

  console.log(
    `[DB] Action FAILED. Reverted ACTION ID ${action.id} to ${revertedStatus}`,
  );
  notifyDeviceStatus(
    action.id,
    "FAILED",
    revertedStatus,
    error || "Thiết bị thực thi thất bại",
    {
      deviceId: action.deviceId,
      timestamp,
    },
  );
};

module.exports = {
  handleDeviceAck,
};
