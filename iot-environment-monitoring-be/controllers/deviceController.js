const Device = require("../models/Device");
const AppError = require("../utils/appError");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

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

module.exports = {
  createDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
};
