const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Action = sequelize.define(
  "Action",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "device_id",
    },
    action: {
      // hành động
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      // trạng thái thiết bị
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "ActionHistory",
    timestamps: true,
  },
);

module.exports = Action;
