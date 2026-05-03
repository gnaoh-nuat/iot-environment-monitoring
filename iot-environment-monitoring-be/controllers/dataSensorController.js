const { Op, Sequelize } = require("sequelize");
const { AppError, parsePagination, parseSort } = require("../utils");
const { DataSensor, Sensor } = require("../models");

const searchDataSensors = async (req, res, next) => {
  try {
    const { pageNo, pageSize, offset } = parsePagination(req.query);
    const orderClause = parseSort(
      req.query,
      ["id", "sensorName", "value", "createdAt"],
      {
        sensorName: {
          model: { model: Sensor, as: "sensorInfo" },
          field: "name",
        },
        value: {
          field: Sequelize.cast(
            Sequelize.col("DataSensor.value"),
            "DOUBLE PRECISION",
          ),
        },
      },
    );

    const { sensorName, q, searchType = "value" } = req.query;

    const normalizedSearchType = String(searchType || "value").toLowerCase();
    if (!["value", "time"].includes(normalizedSearchType)) {
      throw new AppError(400, "searchType không hợp lệ");
    }

    const andConditions = [];

    if (sensorName && sensorName !== "all") {
      andConditions.push({
        "$sensorInfo.name$": {
          [Op.iLike]: `%${sensorName}%`,
        },
      });
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
        const timeQuery = normalizedQuery
          .replace(/,/g, "")
          .replace(/\s+/g, " ");

        andConditions.push(
          Sequelize.where(
            Sequelize.fn(
              "to_char",
              Sequelize.fn(
                "timezone",
                "Asia/Ho_Chi_Minh",
                Sequelize.col("DataSensor.createdAt"),
              ),
              "YYYY/MM/DD HH24:MI:SS",
            ),
            {
              [Op.iLike]: `%${timeQuery}%`,
            },
          ),
        );
      }
    }

    // ================= QUERY =================
    const { count, rows } = await DataSensor.findAndCountAll({
      where: andConditions.length > 0 ? { [Op.and]: andConditions } : {},
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
  searchDataSensors,
};
