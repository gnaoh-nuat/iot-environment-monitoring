const { Op } = require("sequelize");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");
const AppError = require("../utils/appError");

const parseDateInput = (input) => {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

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
      q,
      start,
      end,
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
    const andConditions = [];

    // ================= FILTER SENSOR =================
    if (sensorName && sensorName !== "all") {
      andConditions.push({
        "$sensorInfo.name$": sensorName,
      });
    }

    // ================= DATE RANGE FILTER =================
    if (start || end) {
      const parsedStart = start ? parseDateInput(start) : null;
      const parsedEnd = end ? parseDateInput(end) : null;

      if (start && !parsedStart) {
        throw new AppError(400, "Ngày bắt đầu không hợp lệ");
      }

      if (end && !parsedEnd) {
        throw new AppError(400, "Ngày kết thúc không hợp lệ");
      }

      if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
        throw new AppError(400, "Khoảng thời gian không hợp lệ");
      }

      const timeFilter = {};
      if (parsedStart) {
        timeFilter[Op.gte] = parsedStart;
      }
      if (parsedEnd) {
        timeFilter[Op.lte] = parsedEnd;
      }

      andConditions.push({ createdAt: timeFilter });
    }

    // ================= LEGACY SEARCH SUPPORT =================
    if (!q && searchValue && searchBy) {
      switch (searchBy) {
        case "id":
          andConditions.push({ id: searchValue });
          break;
        case "value":
          andConditions.push({
            value: {
              [Op.iLike]: `%${searchValue}%`,
            },
          });
          break;
        case "name":
          andConditions.push({
            "$sensorInfo.name$": {
              [Op.iLike]: `%${searchValue}%`,
            },
          });
          break;
        case "time": {
          const parsed = parseDateInput(searchValue);
          if (!parsed) {
            throw new AppError(400, "Ngày không hợp lệ");
          }
          const { start: dayStart, end: dayEnd } = buildDayRange(parsed);
          andConditions.push({
            createdAt: {
              [Op.between]: [dayStart, dayEnd],
            },
          });
          break;
        }
      }
    }

    // ================= FREE-TEXT SEARCH (AUTO-INFER) =================
    const normalizedQuery = String(q || "").trim();
    if (normalizedQuery) {
      const queryOrConditions = [
        {
          value: {
            [Op.iLike]: `%${normalizedQuery}%`,
          },
        },
        {
          "$sensorInfo.name$": {
            [Op.iLike]: `%${normalizedQuery}%`,
          },
        },
      ];

      if (/^\d+$/.test(normalizedQuery)) {
        queryOrConditions.push({ id: Number.parseInt(normalizedQuery, 10) });
      }

      const parsedFreeTextDate = parseDateInput(normalizedQuery);
      if (parsedFreeTextDate) {
        const { start: dayStart, end: dayEnd } = buildDayRange(
          parsedFreeTextDate,
        );
        queryOrConditions.push({
          createdAt: {
            [Op.between]: [dayStart, dayEnd],
          },
        });
      }

      andConditions.push({
        [Op.or]: queryOrConditions,
      });
    }

    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
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
          required: true,
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: pageSize,
      offset,
      distinct: true,
      subQuery: false,
    });

    const totalPages = Math.ceil(count / pageSize) || 1;

    return res.status(200).json({
      success: true,
      data: rows,
      message: "Data sensors retrieved successfully",
      pagination: {
        totalRecords: count,
        totalPages,
        currentPage: pageNo,
        pageSize,
        // Backward compatibility fields
        pageNo,
        total: count,
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
