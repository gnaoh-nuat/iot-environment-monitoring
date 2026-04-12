const { Op } = require("sequelize");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");
const sequelize = require("../config/database");
const AppError = require("../utils/appError");

const getDataSensorHistory = async (req, res, next) => {
  try {
    const { sensorName, limit } = req.query;

    if (!sensorName) {
      throw new AppError(400, "sensorName is required");
    }

    const sensor = await Sensor.findOne({
      where: { name: sensorName },
    });

    if (!sensor) {
      throw new AppError(404, "Sensor not found");
    }

    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

    const data = await DataSensor.findAll({
      where: { sensorId: sensor.id },
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
    });

    return res.status(200).json({
      success: true,
      message: `Get ${sensorName} history successfully`,
      data: data.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

const searchDataSensors = async (req, res, next) => {
  try {
    let {
      pageNo = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      sensorName,
      searchBy,
      searchValue,
    } = req.query;

    const parsedPageNo = Number.parseInt(pageNo, 10);
    const parsedPageSize = Number.parseInt(pageSize, 10);

    pageNo =
      Number.isFinite(parsedPageNo) && parsedPageNo > 0 ? parsedPageNo : 1;
    pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(parsedPageSize, 100)
        : 10;

    const offset = (pageNo - 1) * pageSize;

    const where = {};
    const sensorWhere = {};

    // ================= FILTER SENSOR =================
    if (sensorName) {
      sensorWhere.name = sensorName;
    }

    // ================= SEARCH =================
    if (searchValue && searchBy) {
      switch (searchBy) {
        case "id":
          where.id = searchValue;
          break;

        case "value":
          where.value = {
            [Op.like]: `%${searchValue}%`,
          };
          break;

        case "name":
          sensorWhere.name = {
            [Op.like]: `%${searchValue}%`,
          };
          break;

        case "time":
          const start = new Date(searchValue);
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

          where.createdAt = {
            [Op.between]: [start, end],
          };
          break;
      }
    }

    // ================= SORT VALIDATION =================
    const allowedSortFields = ["id", "value", "createdAt"];
    const allowedSortOrder = ["asc", "desc"];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    if (!allowedSortOrder.includes(sortOrder.toLowerCase())) {
      sortOrder = "desc";
    }

    // ================= QUERY =================
    const { count, rows } = await DataSensor.findAndCountAll({
      where,
      include: [
        {
          model: Sensor,
          as: "sensorInfo",
          attributes: ["id", "name"],
          where: Object.keys(sensorWhere).length ? sensorWhere : undefined,
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: pageSize,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      message: "Data sensors retrieved successfully",
      pagination: {
        pageNo,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDataSensorHistory,
  searchDataSensors,
};
