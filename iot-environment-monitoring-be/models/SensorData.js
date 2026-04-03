const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SensorData = sequelize.define(
  "SensorData",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sensor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "sensor_data",
    timestamps: false,
  },
);

module.exports = SensorData;
