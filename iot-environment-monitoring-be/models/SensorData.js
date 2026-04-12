const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DataSensor = sequelize.define(
  "DataSensor",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    sensorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "sensor_id",
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "SensorData",
    timestamps: true,
    indexes: [
      {
        fields: ["sensor_id"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["sensor_id", "createdAt"],
      },
    ],
  },
);

module.exports = DataSensor;
