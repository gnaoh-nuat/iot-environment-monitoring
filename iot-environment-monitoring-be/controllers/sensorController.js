const { Sensor, SensorData } = require("../models");

const listSensors = async (req, res, next) => {
  try {
    const sensors = await Sensor.findAll({
      order: [["id", "ASC"]],
      include: [
        {
          model: SensorData,
          as: "dataLogs",
          separate: true,
          limit: 20,
          order: [["id", "DESC"]],
        },
      ],
    });

    res.status(200).json({ success: true, data: sensors });
  } catch (error) {
    next(error);
  }
};

const getSensorById = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id, {
      include: [
        {
          model: SensorData,
          as: "dataLogs",
          separate: true,
          limit: 50,
          order: [["id", "DESC"]],
        },
      ],
    });

    if (!sensor) {
      return res
        .status(404)
        .json({ success: false, message: "Sensor not found" });
    }

    res.status(200).json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
};

const createSensor = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    }

    const sensor = await Sensor.create({ name: name.trim() });
    res.status(201).json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
};

const updateSensor = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      return res
        .status(404)
        .json({ success: false, message: "Sensor not found" });
    }

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    }

    sensor.name = name.trim();
    await sensor.save();

    res.status(200).json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
};

const deleteSensor = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      return res
        .status(404)
        .json({ success: false, message: "Sensor not found" });
    }

    await sensor.destroy();
    res.status(200).json({ success: true, message: "Sensor deleted" });
  } catch (error) {
    next(error);
  }
};

const listSensorDataBySensor = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      return res
        .status(404)
        .json({ success: false, message: "Sensor not found" });
    }

    const logs = await SensorData.findAll({
      where: { sensor_id: req.params.id },
      order: [["id", "DESC"]],
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

const createSensorData = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      return res
        .status(404)
        .json({ success: false, message: "Sensor not found" });
    }

    const { value, date_time } = req.body;
    if (typeof value !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "value must be a number" });
    }

    const payload = { sensor_id: sensor.id, value };
    if (date_time) {
      payload.date_time = new Date(date_time);
      if (Number.isNaN(payload.date_time.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "date_time is invalid" });
      }
    }

    const log = await SensorData.create(payload);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
  listSensorDataBySensor,
  createSensorData,
};
