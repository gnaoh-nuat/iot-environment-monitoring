const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Device = sequelize.define(
  "Device",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "devices",
    timestamps: true,
  },
);

module.exports = Device;
