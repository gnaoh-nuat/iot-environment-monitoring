const Action = require("../models/ActionHistory");
const Device = require("../models/Device");
const { Op } = require("sequelize");
const { controlDeviceFromDashboard } = require("./deviceController");

// ==========================================
// 1. ĐIỀU KHIỂN THIẾT BỊ (ON/OFF)
// ==========================================
const controlDevice = controlDeviceFromDashboard;

// ==========================================
// 2. TÌM KIẾM & LỌC LỊCH SỬ THAO TÁC
// ==========================================
const searchActions = async (req, res, next) => {
  try {
    let {
      pageNo = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      deviceName,
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
    const deviceWhere = {};

    // FILTER THEO TÊN THIẾT BỊ
    if (deviceName) {
      deviceWhere.name = deviceName;
    }

    // TÌM KIẾM ĐỘNG
    if (searchValue && searchBy) {
      switch (searchBy) {
        case "id":
          where.id = searchValue;
          break;
        case "action":
          where.action = { [Op.like]: `%${searchValue}%` };
          break;
        case "status":
          where.status = { [Op.like]: `%${searchValue}%` };
          break;
        case "deviceName":
          deviceWhere.name = { [Op.like]: `%${searchValue}%` };
          break;
        case "time":
          where.createdAt = new Date(searchValue);
          break;
      }
    }

    // KIỂM TRA ĐIỀU KIỆN SORT TRÁNH LỖI SQL INJECTION
    const allowedSortFields = [
      "id",
      "action",
      "status",
      "createdAt",
      "deviceName",
    ];
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
        },
      ],
      order: [
        sortBy === "deviceName"
          ? [
              { model: Device, as: "deviceInfo" },
              "name",
              sortOrder.toUpperCase(),
            ]
          : [sortBy, sortOrder.toUpperCase()],
      ],
      limit: pageSize,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      message: "Actions retrieved successfully",
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
  controlDevice,
  searchActions,
};
