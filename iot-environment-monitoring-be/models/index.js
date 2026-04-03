const sequelize = require("../config/db");
const Sensor = require("./Sensor");
const SensorData = require("./SensorData");
const Device = require("./Device");
const ActionHistory = require("./ActionHistory");

Sensor.hasMany(SensorData, {
  foreignKey: "sensor_id",
  as: "dataLogs",
  onDelete: "CASCADE",
});

SensorData.belongsTo(Sensor, {
  foreignKey: "sensor_id",
  as: "sensorInfo",
});

Device.hasMany(ActionHistory, {
  foreignKey: "device_id",
  as: "actionLogs",
  onDelete: "CASCADE",
});

ActionHistory.belongsTo(Device, {
  foreignKey: "device_id",
  as: "deviceInfo",
});

module.exports = {
  sequelize,
  Sensor,
  SensorData,
  Device,
  ActionHistory,
};
