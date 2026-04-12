const Sensor = require("./Sensor");
const SensorData = require("./SensorData");
const Device = require("./Device");
const ActionHistory = require("./ActionHistory");

const initializeAssociations = () => {
  // Sensor -> SensorData (1-n)
  if (!Sensor.associations.dataLogs) {
    Sensor.hasMany(SensorData, {
      foreignKey: "sensorId",
      as: "dataLogs",
      onDelete: "CASCADE",
    });
  }

  if (!SensorData.associations.sensorInfo) {
    SensorData.belongsTo(Sensor, {
      foreignKey: "sensorId",
      as: "sensorInfo",
    });
  }

  // Device -> ActionHistory (1-n)
  if (!Device.associations.actionLogs) {
    Device.hasMany(ActionHistory, {
      foreignKey: "deviceId",
      as: "actionLogs",
      onDelete: "CASCADE",
    });
  }

  if (!ActionHistory.associations.deviceInfo) {
    ActionHistory.belongsTo(Device, {
      foreignKey: "deviceId",
      as: "deviceInfo",
    });
  }
};

module.exports = initializeAssociations;
