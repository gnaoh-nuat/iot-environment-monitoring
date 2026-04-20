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

const isDateOnlyQuery = (input) => {
  const normalizedInput = String(input || "").trim();

  return (
    /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(normalizedInput) ||
    /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(normalizedInput)
  );
};

// ==========================================
// TÌM KIẾM & LỌC LỊCH SỬ THAO TÁC
// ==========================================
const searchActions = async (req, res, next) => {
  try {
    let {
      pageNo = 1,
      pageSize = 10,
      deviceName,
      action,
      statusGroup,
      q,
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

    const normalizedSortOrder = String(sortOrder || "desc").toLowerCase();
    if (!["asc", "desc"].includes(normalizedSortOrder)) {
      throw new AppError(400, "sortOrder không hợp lệ");
    }

    const normalizedSortBy = String(sortBy || "createdAt");
    if (
      !["id", "deviceName", "action", "createdAt", "status"].includes(
        normalizedSortBy,
      )
    ) {
      throw new AppError(400, "sortBy không hợp lệ");
    }

    let orderClause = [["createdAt", normalizedSortOrder.toUpperCase()]];
    if (["id", "action", "createdAt", "status"].includes(normalizedSortBy)) {
      orderClause = [[normalizedSortBy, normalizedSortOrder.toUpperCase()]];
    }
    if (normalizedSortBy === "deviceName") {
      orderClause = [
        [
          { model: Device, as: "deviceInfo" },
          "name",
          normalizedSortOrder.toUpperCase(),
        ],
      ];
    }

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

    // FREE-TEXT SEARCH (AUTO-INFER)
    const normalizedQuery = String(q || "").trim();
    if (normalizedQuery) {
      // Xóa dấu phẩy nếu dính từ UI
      const timeQuery = normalizedQuery.replace(/,/g, "").replace(/\s+/g, " ");

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
          {
            [Op.iLike]: `%${timeQuery}%`,
          },
        ),
      ];

      if (/^\d+$/.test(normalizedQuery)) {
        queryOrConditions.push({ id: Number.parseInt(normalizedQuery, 10) });
      }

      const parsedFreeTextDate = isDateOnlyQuery(timeQuery)
        ? parseDateInput(timeQuery)
        : null;
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
