const { ActionHistory, Device } = require("../models");

const listActionHistory = async (req, res, next) => {
  try {
    const logs = await ActionHistory.findAll({
      order: [["id", "DESC"]],
      include: [{ model: Device, as: "deviceInfo" }],
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

const getActionById = async (req, res, next) => {
  try {
    const action = await ActionHistory.findByPk(req.params.id, {
      include: [{ model: Device, as: "deviceInfo" }],
    });

    if (!action) {
      return res
        .status(404)
        .json({ success: false, message: "Action history not found" });
    }

    res.status(200).json({ success: true, data: action });
  } catch (error) {
    next(error);
  }
};

const createAction = async (req, res, next) => {
  try {
    const { device_id, action, status, time } = req.body;

    if (!device_id || typeof device_id !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "device_id must be a number" });
    }
    if (!action || typeof action !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "action is required" });
    }
    if (!status || typeof status !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "status is required" });
    }

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    const payload = {
      device_id,
      action: action.trim(),
      status: status.trim(),
    };

    if (time) {
      payload.time = new Date(time);
      if (Number.isNaN(payload.time.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "time is invalid" });
      }
    }

    const log = await ActionHistory.create(payload);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

const updateAction = async (req, res, next) => {
  try {
    const existing = await ActionHistory.findByPk(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Action history not found" });
    }

    const { device_id, action, status, time } = req.body;

    if (device_id !== undefined) {
      if (typeof device_id !== "number") {
        return res
          .status(400)
          .json({ success: false, message: "device_id must be a number" });
      }
      const device = await Device.findByPk(device_id);
      if (!device) {
        return res
          .status(404)
          .json({ success: false, message: "Device not found" });
      }
      existing.device_id = device_id;
    }

    if (action !== undefined) {
      if (typeof action !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "action must be a string" });
      }
      existing.action = action.trim();
    }

    if (status !== undefined) {
      if (typeof status !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "status must be a string" });
      }
      existing.status = status.trim();
    }

    if (time !== undefined) {
      const parsed = new Date(time);
      if (Number.isNaN(parsed.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "time is invalid" });
      }
      existing.time = parsed;
    }

    await existing.save();
    res.status(200).json({ success: true, data: existing });
  } catch (error) {
    next(error);
  }
};

const deleteAction = async (req, res, next) => {
  try {
    const existing = await ActionHistory.findByPk(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Action history not found" });
    }

    await existing.destroy();
    res.status(200).json({ success: true, message: "Action history deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listActionHistory,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
};
