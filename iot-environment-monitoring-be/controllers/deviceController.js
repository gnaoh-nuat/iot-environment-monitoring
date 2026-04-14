const Device = require("../models/Device");
const Action = require("../models/ActionHistory");
const { Op } = require("sequelize");
const AppError = require("../utils/appError");
const sequelize = require("../config/database");
const { publishCommand } = require("../mqtt/mqttClient");
const { emitSensorData } = require("../socket/socketHandler");
const { scheduleActionTimeout } = require("../services/deviceControlTracker");

const socketDeviceTopic = process.env.SOCKET_DEVICE_TOPIC || "device-status";

// ===== CREATE DEVICE =====
const createDevice = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new AppError(400, "Device name is required");
    }

    const device = await Device.create({ name });

    return res.status(201).json({
      success: true,
      data: device,
      message: "Device created successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== GET ALL DEVICES =====
const getAllDevices = async (req, res, next) => {
  try {
    const devices = await Device.findAll();

    return res.status(200).json({
      success: true,
      data: devices,
      message: "Devices retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== GET DEVICE BY ID =====
const getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id);

    if (!device) {
      throw new AppError(404, "Device not found");
    }

    return res.status(200).json({
      success: true,
      data: device,
      message: "Device retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== UPDATE DEVICE =====
const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      throw new AppError(400, "Device name is required");
    }

    const device = await Device.findByPk(id);

    if (!device) {
      throw new AppError(404, "Device not found");
    }

    await device.update({ name });

    return res.status(200).json({
      success: true,
      data: device,
      message: "Device updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== DELETE DEVICE =====
const deleteDevice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id);

    if (!device) {
      throw new AppError(404, "Device not found");
    }

    await device.destroy();

    return res.status(200).json({
      success: true,
      data: null,
      message: "Device deleted",
    });
  } catch (err) {
    next(err);
  }
};

// ===== DASHBOARD CONTROL DEVICE =====
const controlDeviceFromDashboard = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { deviceId, action } = req.body;
    const normalizedAction = String(action || "").toUpperCase();

    if (!deviceId || !normalizedAction) {
      throw new AppError(400, "deviceId and action are required");
    }

    if (!["ON", "OFF"].includes(normalizedAction)) {
      throw new AppError(400, "Action must be ON or OFF");
    }

    const device = await Device.findByPk(deviceId, { transaction });
    if (!device) {
      throw new AppError(404, "Device not found");
    }

    const existingPendingAction = await Action.findOne({
      where: {
        deviceId,
        status: "PENDING",
      },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (existingPendingAction) {
      throw new AppError(
        409,
        "Device already has a pending command. Please wait for completion.",
      );
    }

    const newAction = await Action.create(
      {
        deviceId,
        action: normalizedAction,
        status: "PENDING",
      },
      { transaction },
    );

    await transaction.commit();

    const timestamp = new Date().toISOString();
    publishCommand({
      actionId: newAction.id,
      deviceId,
      action: normalizedAction,
      timestamp,
    });

    scheduleActionTimeout(newAction.id, async () => {
      try {
        const actionRow = await Action.findByPk(newAction.id);
        if (!actionRow || actionRow.status !== "PENDING") {
          return;
        }

        const previousAction = await Action.findOne({
          where: {
            deviceId: actionRow.deviceId,
            status: { [Op.in]: ["ON", "OFF"] },
          },
          order: [["createdAt", "DESC"]],
        });

        const revertedStatus = previousAction ? previousAction.status : "OFF";

        await actionRow.update({ status: revertedStatus });

        emitSensorData(socketDeviceTopic, {
          actionId: actionRow.id,
          deviceId: actionRow.deviceId,
          status: "TIMEOUT", // Gửi TIMEOUT để UI biết là lỗi
          targetState: revertedStatus, // Trạng thái thực tế sau khi hoàn tác
          error: "Device offline or no response within 10 seconds",
          timestamp: new Date().toISOString(),
        });
      } catch (timeoutError) {
        console.error(
          "[TIMEOUT] Failed to resolve timed-out action:",
          timeoutError,
        );
      }
    });

    return res.status(202).json({
      success: true,
      data: {
        actionId: newAction.id,
        deviceId,
        action: normalizedAction,
        status: "PENDING",
      },
      message: "Dang xu ly",
    });
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    next(err);
  }
};

module.exports = {
  createDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  controlDeviceFromDashboard,
};
