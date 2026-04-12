const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Sensor = sequelize.define(
  "Sensor",
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
    tableName: "sensors",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  },
);

module.exports = Sensor;
