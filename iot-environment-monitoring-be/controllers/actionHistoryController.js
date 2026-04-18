const Action = require("../models/ActionHistory");
const Device = require("../models/Device");
const { Op, Sequelize } = require("sequelize");
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

// ==========================================
// TÌM KIẾM & LỌC LỊCH SỬ THAO TÁC
// ==========================================
const searchActions = async (req, res, next) => {
  try {
    let {
      pageNo = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      deviceName,
      action,
      statusGroup,
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
    const deviceWhere = {};

    // FILTER THEO TÊN THIẾT BỊ
    if (deviceName && deviceName !== "all") {
      deviceWhere.name = deviceName;
    }

    // FILTER THEO HÀNH ĐỘNG
    if (action && action !== "all") {
      andConditions.push({ action: String(action).toUpperCase() });
    }

    // FILTER THEO NHÓM TRẠNG THÁI
    if (statusGroup && statusGroup !== "all") {
      const normalizedStatusGroup = String(statusGroup).toLowerCase();

      if (normalizedStatusGroup === "success") {
        andConditions.push({
          status: { [Op.in]: ["ON", "OFF"] },
        });
        andConditions.push(
          Sequelize.where(
            Sequelize.col("Action.action"),
            Op.eq,
            Sequelize.col("Action.status"),
          ),
        );
      } else if (normalizedStatusGroup === "pending") {
        andConditions.push({ status: "PENDING" });
      } else if (normalizedStatusGroup === "failure") {
        andConditions.push({ status: { [Op.ne]: "PENDING" } });
        andConditions.push({
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
      } else {
        throw new AppError(400, "statusGroup không hợp lệ");
      }
    }

    // FILTER THEO KHOẢNG THỜI GIAN
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

    // LEGACY SEARCH SUPPORT
    if (!q && searchValue && searchBy) {
      switch (searchBy) {
        case "id":
          andConditions.push({ id: searchValue });
          break;
        case "action":
          andConditions.push({
            action: { [Op.iLike]: `%${searchValue}%` },
          });
          break;
        case "status":
          andConditions.push({
            status: { [Op.iLike]: `%${searchValue}%` },
          });
          break;
        case "deviceName":
          deviceWhere.name = { [Op.iLike]: `%${searchValue}%` };
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

    // FREE-TEXT SEARCH (AUTO-INFER)
    const normalizedQuery = String(q || "").trim();
    if (normalizedQuery) {
      const queryOrConditions = [
        {
          action: {
            [Op.iLike]: `%${normalizedQuery}%`,
          },
        },
        {
          status: {
            [Op.iLike]: `%${normalizedQuery}%`,
          },
        },
        {
          "$deviceInfo.name$": {
            [Op.iLike]: `%${normalizedQuery}%`,
          },
        },
      ];

      if (/^\d+$/.test(normalizedQuery)) {
        queryOrConditions.push({ id: Number.parseInt(normalizedQuery, 10) });
      }

      const parsedFreeTextDate = parseDateInput(normalizedQuery);
      if (parsedFreeTextDate) {
        const { start: dayStart, end: dayEnd } =
          buildDayRange(parsedFreeTextDate);
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

    // KIỂM TRA ĐIỀU KIỆN SORT TRÁNH LỖI SQL INJECTION
    const allowedSortFields = ["id", "action", "status", "createdAt"];
    const allowedSortOrder = ["asc", "desc"];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    if (!allowedSortOrder.includes(sortOrder.toLowerCase())) {
      sortOrder = "desc";
    }

    // THỰC THI QUERY TỪ DATABASE
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
      message: "Actions retrieved successfully",
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
  searchActions,
};
