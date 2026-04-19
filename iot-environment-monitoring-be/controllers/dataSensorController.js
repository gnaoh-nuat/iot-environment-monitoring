const { Op, Sequelize } = require("sequelize");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");
const AppError = require("../utils/appError");

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const SENSOR_KEYWORDS = {
  temperature: [
    "temperature",
    "temp",
    "nhiet",
    "nhiet do",
    "nhiệt",
    "nhiệt độ",
  ],
  humidity: ["humidity", "humid", "do am", "am", "độ ẩm", "do am"],
  light: ["light", "anh sang", "lux", "sang", "ánh sáng"],
};

const buildSensorNameLikeConditions = (input) => {
  const normalizedInput = normalizeText(input);
  const relatedKeywords = Object.values(SENSOR_KEYWORDS)
    .flat()
    .filter(
      (keyword) =>
        normalizedInput.includes(normalizeText(keyword)) ||
        normalizeText(keyword).includes(normalizedInput),
    );

  const candidates = Array.from(new Set([input, ...relatedKeywords])).filter(
    Boolean,
  );

  return candidates.map((candidate) => ({
    "$sensorInfo.name$": {
      [Op.iLike]: `%${candidate}%`,
    },
  }));
};

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
      sensorName,
      q,
      searchType = "value",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const parsedPageNo = Number.parseInt(pageNo, 10);
    const parsedPageSize = Number.parseInt(pageSize, 10);

    pageNo =
      Number.isFinite(parsedPageNo) && parsedPageNo > 0 ? parsedPageNo : 1;
    pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? parsedPageSize
        : 10;

    const offset = (pageNo - 1) * pageSize;

    const where = {};
    const andConditions = [];

    // ================= FILTER SENSOR =================
    if (sensorName && sensorName !== "all") {
      const sensorNameConditions = buildSensorNameLikeConditions(sensorName);
      andConditions.push(
        sensorNameConditions.length > 1
          ? { [Op.or]: sensorNameConditions }
          : sensorNameConditions[0],
      );
    }

    const normalizedSearchType = String(searchType || "value").toLowerCase();
    if (!["value", "time"].includes(normalizedSearchType)) {
      throw new AppError(400, "searchType không hợp lệ");
    }

    const normalizedSortOrder = String(sortOrder || "desc").toLowerCase();
    if (!["asc", "desc"].includes(normalizedSortOrder)) {
      throw new AppError(400, "sortOrder không hợp lệ");
    }

    const normalizedSortBy = String(sortBy || "createdAt");
    if (
      !["id", "sensorName", "value", "createdAt"].includes(normalizedSortBy)
    ) {
      throw new AppError(400, "sortBy không hợp lệ");
    }

    let orderClause = [["createdAt", normalizedSortOrder.toUpperCase()]];
    if (["id", "createdAt"].includes(normalizedSortBy)) {
      orderClause = [[normalizedSortBy, normalizedSortOrder.toUpperCase()]];
    }
    if (normalizedSortBy === "value") {
      orderClause = [
        [
          Sequelize.cast(Sequelize.col("DataSensor.value"), "DOUBLE PRECISION"),
          normalizedSortOrder.toUpperCase(),
        ],
      ];
    }
    if (normalizedSortBy === "sensorName") {
      orderClause = [
        [
          { model: Sensor, as: "sensorInfo" },
          "name",
          normalizedSortOrder.toUpperCase(),
        ],
      ];
    }

    // ================= FREE-TEXT SEARCH (BY SEARCH TYPE) =================
    const normalizedQuery = String(q || "").trim();
    if (normalizedQuery) {
      if (normalizedSearchType === "value") {
        andConditions.push(
          Sequelize.where(Sequelize.cast(Sequelize.col("value"), "TEXT"), {
            [Op.iLike]: `%${normalizedQuery}%`,
          }),
        );
      }

      if (normalizedSearchType === "time") {
        // Xóa dấu phẩy nếu trình duyệt copy bị dính (vd: 03:58:17, 13/04/2026 -> 03:58:17 13/04/2026)
        const timeQuery = normalizedQuery
          .replace(/,/g, "")
          .replace(/\s+/g, " ");

        const timeSearchConditions = [
          Sequelize.where(
            Sequelize.fn(
              "to_char",
              Sequelize.fn(
                "timezone",
                "Asia/Ho_Chi_Minh",
                Sequelize.col("DataSensor.createdAt"),
              ),
              "HH24:MI:SS DD/MM/YYYY",
            ),
            {
              [Op.iLike]: `%${timeQuery}%`,
            },
          ),
          Sequelize.where(
            Sequelize.fn(
              "to_char",
              Sequelize.fn(
                "timezone",
                "Asia/Ho_Chi_Minh",
                Sequelize.col("DataSensor.createdAt"),
              ),
              "DD/MM/YYYY HH24:MI:SS",
            ),
            {
              [Op.iLike]: `%${timeQuery}%`,
            },
          ),
        ];

        const parsedFreeTextDate = parseDateInput(normalizedQuery);
        if (parsedFreeTextDate) {
          const { start: dayStart, end: dayEnd } =
            buildDayRange(parsedFreeTextDate);
          timeSearchConditions.push({
            createdAt: {
              [Op.between]: [dayStart, dayEnd],
            },
          });
        }

        andConditions.push({
          [Op.or]: timeSearchConditions,
        });
      }
    }

    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
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
      order: orderClause,
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
