const { Sensor } = require("../models");
const { AppError } = require("../utils");

// Helper nội bộ để DRY (Don't Repeat Yourself) logic tìm kiếm và bắt lỗi 404
const findSensorOr404 = async (id) => {
  const sensor = await Sensor.findByPk(id);
  if (!sensor) throw new AppError(404, "Sensor not found");
  return sensor;
};

// ===== CRUD OPERATIONS =====
const createSensor = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new AppError(400, "Sensor name is required");

    const existed = await Sensor.findOne({ where: { name } });
    if (existed) throw new AppError(400, "Sensor already exists");

    const sensor = await Sensor.create({ name });
    res.status(201).json({
      success: true,
      data: sensor,
      message: "Sensor created successfully",
    });
  } catch (err) {
    next(err);
  }
};

const getAllSensors = async (req, res, next) => {
  try {
    const sensors = await Sensor.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).json({
      success: true,
      data: sensors,
      message: "Sensors retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
};

const getSensorById = async (req, res, next) => {
  try {
    const sensor = await findSensorOr404(req.params.id);
    res.status(200).json({
      success: true,
      data: sensor,
      message: "Sensor retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
};

const updateSensor = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new AppError(400, "Sensor name is required");

    const sensor = await findSensorOr404(req.params.id);

    // Kiểm tra trùng lặp tên (ngoại trừ chính nó)
    const existed = await Sensor.findOne({ where: { name } });
    if (existed && existed.id !== sensor.id) {
      throw new AppError(400, "Sensor name already exists");
    }

    await sensor.update({ name });
    res.status(200).json({
      success: true,
      data: sensor,
      message: "Sensor updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

const deleteSensor = async (req, res, next) => {
  try {
    const sensor = await findSensorOr404(req.params.id);
    await sensor.destroy();
    res.status(200).json({
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
