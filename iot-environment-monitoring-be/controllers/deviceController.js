const { Device, ActionHistory } = require("../models");

const listDevices = async (req, res, next) => {
  try {
    const devices = await Device.findAll({
      order: [["id", "ASC"]],
      include: [
        {
          model: ActionHistory,
          as: "actionLogs",
          separate: true,
          limit: 20,
          order: [["id", "DESC"]],
        },
      ],
    });

    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
};

const getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [
        {
          model: ActionHistory,
          as: "actionLogs",
          separate: true,
          limit: 50,
          order: [["id", "DESC"]],
        },
      ],
    });

    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    res.status(200).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

const createDevice = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    }

    const device = await Device.create({ name: name.trim() });
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

const updateDevice = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    }

    device.name = name.trim();
    await device.save();

    res.status(200).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

const deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    await device.destroy();
    res.status(200).json({ success: true, message: "Device deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
};
