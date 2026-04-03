const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Sensor = sequelize.define(
  "Sensor",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "sensors",
    timestamps: false,
  },
);

module.exports = Sensor;
