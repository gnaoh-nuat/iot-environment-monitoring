const { Op, Sequelize } = require("sequelize");
const { AppError, parsePagination, parseSort } = require("../utils");
const { ActionHistory: Action, Device } = require("../models");

const isValidTimeZone = (value) => {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
};

const STATUS_GROUP_HANDLERS = {
  success: (conditions) => {
    conditions.push({ status: { [Op.in]: ["ON", "OFF"] } });
    conditions.push(
      Sequelize.where(
        Sequelize.col("Action.action"),
        Op.eq,
        Sequelize.col("Action.status"),
      ),
    );
  },
  pending: (conditions) => conditions.push({ status: "PENDING" }),
  failure: (conditions) => {
    conditions.push({ status: { [Op.ne]: "PENDING" } });
    conditions.push({
      [Op.or]: [
        { status: { [Op.notIn]: ["ON", "OFF", "PENDING"] } },
        {
          [Op.and]: [
            { status: { [Op.in]: ["ON", "OFF"] } },
            Sequelize.where(
              Sequelize.col("Action.action"),
              Op.ne,
              Sequelize.col("Action.status"),
            ),
          ],
        },
      ],
    });
  },
};

const searchActions = async (req, res, next) => {
  try {
    const { pageNo, pageSize, offset } = parsePagination(req.query);
    const orderClause = parseSort(
      req.query,
      ["id", "deviceName", "action", "createdAt", "status"],
      {
        deviceName: {
          model: { model: Device, as: "deviceInfo" },
          field: "name",
        },
      },
    );

    const { deviceName, action, statusGroup, q } = req.query;
    const where = {};
    const andConditions = [];
    const deviceWhere = {};

    if (deviceName && deviceName !== "all") deviceWhere.name = deviceName;
    if (action && action !== "all")
      andConditions.push({ action: String(action).toUpperCase() });

    if (statusGroup && statusGroup !== "all") {
      const handler = STATUS_GROUP_HANDLERS[String(statusGroup).toLowerCase()];
      if (!handler) throw new AppError(400, "statusGroup không hợp lệ");
      handler(andConditions);
    }

    const normalizedQuery = String(q || "").trim();
    if (normalizedQuery) {
      const timeQuery = normalizedQuery.replace(/,/g, "").replace(/\s+/g, " ");

      const queryOrConditions = [
        { action: { [Op.iLike]: `%${normalizedQuery}%` } },
        { status: { [Op.iLike]: `%${normalizedQuery}%` } },
        { "$deviceInfo.name$": { [Op.iLike]: `%${normalizedQuery}%` } },
        Sequelize.where(
          Sequelize.fn(
            "to_char",
            Sequelize.fn(
              "timezone",
              "Asia/Ho_Chi_Minh",
              Sequelize.col("Action.createdAt"),
            ),
            "YYYY/MM/DD HH24:MI:SS",
          ),
          { [Op.iLike]: `%${timeQuery}%` },
        ),
      ];

      if (/^\d+$/.test(normalizedQuery))
        queryOrConditions.push({ id: Number.parseInt(normalizedQuery, 10) });

      andConditions.push({ [Op.or]: queryOrConditions });
    }

    if (andConditions.length > 0) where[Op.and] = andConditions;

    const { count, rows } = await Action.findAndCountAll({
      where,
      include: [
        {
          model: Device,
          as: "deviceInfo",
          attributes: ["id", "name"],
          where: Object.keys(deviceWhere).length ? deviceWhere : undefined,
          required: Object.keys(deviceWhere).length > 0,
        },
      ],
      order: orderClause,
      limit: pageSize,
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      message: "Actions retrieved successfully",
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / pageSize) || 1,
        currentPage: pageNo,
        pageSize,
        pageNo,
        total: count,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getDeviceManagementDailyStats = async (req, res, next) => {
  try {
    const selectedDate = String(req.query.date || "").trim();
    const timezone = String(req.query.timezone || "Asia/Ho_Chi_Minh").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate))
      throw new AppError(
        400,
        "date không hợp lệ, định dạng đúng là YYYY-MM-DD",
      );
    if (!isValidTimeZone(timezone))
      throw new AppError(400, "timezone không hợp lệ");

    const devices = await Device.findAll({
      attributes: ["id", "name"],
      order: [["createdAt", "ASC"]],
      limit: 5,
    });
    if (devices.length === 0)
      return res.status(200).json({
        success: true,
        data: { selectedDate, timezone, devices: [], countsByDevice: [] },
      });

    const deviceIds = devices.map((d) => d.id);
    const actionsInDay = await Action.findAll({
      attributes: ["deviceId", "action"],
      where: {
        deviceId: { [Op.in]: deviceIds },
        status: { [Op.in]: ["ON", "OFF"] },
        [Op.and]: [
          Sequelize.where(
            Sequelize.col("Action.action"),
            Op.eq,
            Sequelize.col("Action.status"),
          ),
          Sequelize.where(
            Sequelize.fn(
              "to_char",
              Sequelize.fn(
                "timezone",
                timezone,
                Sequelize.col("Action.createdAt"),
              ),
              "YYYY-MM-DD",
            ),
            selectedDate,
          ),
        ],
      },
      raw: true,
    });

    const statsMap = actionsInDay.reduce((acc, row) => {
      const id = String(row.deviceId);
      if (!acc[id]) acc[id] = { onCount: 0, offCount: 0 };
      if (String(row.action).toUpperCase() === "ON") acc[id].onCount++;
      if (String(row.action).toUpperCase() === "OFF") acc[id].offCount++;
      return acc;
    }, {});

    const countsByDevice = devices.map((device) => {
      const stats = statsMap[String(device.id)] || { onCount: 0, offCount: 0 };
      return {
        deviceId: Number(device.id),
        deviceName: device.name,
        onCount: stats.onCount,
        offCount: stats.offCount,
        total: stats.onCount + stats.offCount,
      };
    });

    return res.status(200).json({
      success: true,
      data: { selectedDate, timezone, devices, countsByDevice },
      message: "Thống kê thành công",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchActions, getDeviceManagementDailyStats };
