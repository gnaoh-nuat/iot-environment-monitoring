const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// 1. Tối ưu: Đưa cấu hình Primary Key dùng chung ra một biến để tránh lặp lại 4 lần
const PK_BIGINT = {
  type: DataTypes.BIGINT,
  autoIncrement: true,
  primaryKey: true,
};

const Device = sequelize.define(
  "Device",
  {
    id: PK_BIGINT,
    name: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "devices",
    // Bỏ timestamps: true vì Sequelize mặc định đã bật
  },
);

const Sensor = sequelize.define(
  "Sensor",
  {
    id: PK_BIGINT,
    name: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "sensors",
    indexes: [{ unique: true, fields: ["name"] }],
  },
);

const DataSensor = sequelize.define(
  "DataSensor",
  {
    id: PK_BIGINT,
    sensorId: { type: DataTypes.BIGINT, allowNull: false, field: "sensor_id" },
    value: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "SensorData",
    indexes: [
      { fields: ["sensor_id"] },
      { fields: ["createdAt"] },
      { fields: ["sensor_id", "createdAt"] },
    ],
  },
);

const ActionHistory = sequelize.define(
  "Action",
  {
    id: PK_BIGINT,
    deviceId: { type: DataTypes.BIGINT, allowNull: false, field: "device_id" },
    action: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "ActionHistory",
  },
);

const initializeAssociations = () => {
  Sensor.hasMany(DataSensor, {
    foreignKey: "sensorId",
    as: "dataLogs",
    onDelete: "CASCADE",
  });
  DataSensor.belongsTo(Sensor, { foreignKey: "sensorId", as: "sensorInfo" });

  Device.hasMany(ActionHistory, {
    foreignKey: "deviceId",
    as: "actionLogs",
    onDelete: "CASCADE",
  });
  ActionHistory.belongsTo(Device, { foreignKey: "deviceId", as: "deviceInfo" });
};

module.exports = {
  sequelize,
  Device,
  Sensor,
  DataSensor,
  ActionHistory,
  initializeAssociations,
};
