const Action = require("../models/ActionHistory"); // Hoặc ActionHistory tùy cách bạn đặt tên model
const Device = require("../models/Device");
const { publishCommand } = require("../mqtt/mqttClient");
const sequelize = require("../config/database.js");
const { Op } = require("sequelize");
const AppError = require("../utils/appError");

// ==========================================
// 1. ĐIỀU KHIỂN THIẾT BỊ (ON/OFF)
// ==========================================
const controlDevice = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { deviceId, action } = req.body;

    if (!deviceId || !action) {
      throw new AppError(400, "Missing deviceId or action");
    }

    if (!["ON", "OFF"].includes(action)) {
      throw new AppError(400, "Action must be ON or OFF");
    }

    const device = await Device.findByPk(deviceId);

    if (!device) {
      throw new AppError(404, "Device not found");
    }

    // Lưu action với trạng thái LOADING chờ MQTT phản hồi
    const newAction = await Action.create(
      {
        deviceId,
        action,
        status: "LOADING",
      },
      { transaction },
    );

    // Gửi lệnh qua MQTT
    const payload = {
      actionId: newAction.id,
      deviceId,
      action,
    };

    publishCommand(payload);
    console.log("[MQTT] Sent command:", payload);

    await transaction.commit();

    // Thiết lập Timeout 10s (ngoài transaction)
    // Nếu sau 10s phần cứng chưa gửi MQTT trả về báo thành công -> Đánh dấu FAILED
    setTimeout(async () => {
      try {
        const actionCheck = await Action.findByPk(newAction.id);

        if (actionCheck && actionCheck.status === "LOADING") {
          await actionCheck.update({ status: "FAILED" });
          console.log(`[TIMEOUT] Action ${newAction.id} FAILED`);
        }
      } catch (err) {
        console.error("[TIMEOUT ERROR]", err);
      }
    }, 10000);

    return res.status(200).json({
      success: true,
      message: "Command sent successfully",
      data: newAction,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

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
