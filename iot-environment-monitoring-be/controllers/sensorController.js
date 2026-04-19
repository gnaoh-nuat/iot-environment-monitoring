const Sensor = require("../models/Sensor");
const AppError = require("../utils/appError");

// ===== CREATE SENSOR =====
const createSensor = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new AppError(400, "Sensor name is required");
    }

    const existed = await Sensor.findOne({ where: { name } });
    if (existed) {
      throw new AppError(400, "Sensor already exists");
    }

    const sensor = await Sensor.create({ name });

    return res.status(201).json({
      success: true,
      data: sensor,
      message: "Sensor created successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== GET ALL SENSOR =====
const getAllSensors = async (req, res, next) => {
  try {
    const sensors = await Sensor.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: sensors,
      message: "Sensors retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== GET SENSOR BY ID =====
const getSensorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sensor = await Sensor.findByPk(id);

    if (!sensor) {
      throw new AppError(404, "Sensor not found");
    }

    return res.status(200).json({
      success: true,
      data: sensor,
      message: "Sensor retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== UPDATE SENSOR =====
const updateSensor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const sensor = await Sensor.findByPk(id);

    if (!sensor) {
      throw new AppError(404, "Sensor not found");
    }

    if (!name) {
      throw new AppError(400, "Sensor name is required");
    }

    // check duplicate
    const existed = await Sensor.findOne({ where: { name } });
    if (existed && existed.id !== sensor.id) {
      throw new AppError(400, "Sensor name already exists");
    }

    await sensor.update({ name });

    return res.status(200).json({
      success: true,
      data: sensor,
      message: "Sensor updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ===== DELETE SENSOR =====
const deleteSensor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sensor = await Sensor.findByPk(id);

    if (!sensor) {
      throw new AppError(404, "Sensor not found");
    }

    await sensor.destroy();

    return res.status(200).json({
      success: true,
      data: null,
      message: "Sensor deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSensor,
  getAllSensors,
  getSensorById,
  updateSensor,
  deleteSensor,
};
