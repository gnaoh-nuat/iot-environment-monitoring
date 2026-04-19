---
description: "Use when defining Sequelize models, setting up associations, or writing database queries. Ensures proper foreign keys, eager loading, and cascade behaviors."
applyTo:
  - "iot-environment-monitoring-be/models/**/*.js"
  - "iot-environment-monitoring-be/controllers/**/*.js"
---

# Database Models (Sequelize)

## Project-Specific Naming (Important)

This repository uses file names and model names that are not fully uniform:

- `models/Sensor.js` defines model `Sensor`, table `sensors`
- `models/Device.js` defines model `Device`, table `devices`
- `models/SensorData.js` defines model `DataSensor`, table `SensorData`
- `models/ActionHistory.js` defines model `Action`, table `ActionHistory`

Do not rename model/table identifiers casually. Keep compatibility with existing queries and includes.

## Model Definition Template

```javascript
// iot-environment-monitoring-be/models/SensorData.js
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
  },
);

module.exports = DataSensor;
```

### Rules

- **Use camelCase model attributes** (`sensorId`, `deviceId`) and map DB columns via `field` when needed.
- **Keep existing `tableName` values unchanged** unless you are doing a planned migration.
- **Always set `timestamps: true`** (createdAt, updatedAt tracked automatically)
- **Use `ENUM` only when the model truly needs fixed value constraints**
- **Set `allowNull: false`** for required fields
- **Use `unique: true`** for naturally unique fields (sensor name, email)

## Associations (Critical)

**All associations defined in `models/associations.js`—never in individual model files.**

```javascript
// iot-environment-monitoring-be/models/associations.js
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
```

### Rules

- **Use `as` alias consistently**: queries rely on exact alias names.
- **Keep idempotent guards** (`if (!Model.associations.alias)`) to avoid duplicate association errors during hot reload.
- **Match `foreignKey` to model attribute**: If model has `deviceId`, use `foreignKey: 'deviceId'`
- **Set `onDelete: 'CASCADE'` for cascading deletes**: Deleting parent also deletes children
- **Both sides of relationship**: `hasMany` + `belongsTo` on both models

## Querying with Eager Loading

### ✅ Correct (Using Associations)

```javascript
// Include related data using the 'as' alias
const devices = await Device.findAll({
  include: { association: "actionLogs", required: false },
  // 'actionLogs' matches the 'as' in associations.js
  order: [["createdAt", "DESC"]],
});

// Result: { id, name, actionLogs: [ { id, action, status }, ... ] }
```

### ❌ Wrong

```javascript
// Raw SQL or querying separately (inefficient/inconsistent)
const devices = await Device.findAll();
const actions = await Action.findAll({ where: { deviceId: devices[0].id } });

// Or: Wrong alias name
const devices = await Device.findAll({
  include: { as: "actions" }, // Should be 'actionLogs'
});
```

## Filtering, Pagination & Sorting

```javascript
const {
  pageNo = 1,
  pageSize = 10,
  sensorId,
  startDate,
  endDate,
  sortOrder = "DESC",
} = req.query;
const offset = (pageNo - 1) * pageSize;

// Build WHERE clause
const where = {};
if (sensorId) where.sensorId = parseInt(sensorId);
if (startDate && endDate) {
  where.createdAt = {
    [Op.between]: [new Date(startDate), new Date(endDate)],
  };
}

// Query with pagination
const { count, rows } = await SensorData.findAndCountAll({
  where,
  include: { association: "sensorInfo", required: true },
  offset,
  limit: parseInt(pageSize, 10),
  order: [["createdAt", sortOrder === "ASC" ? "ASC" : "DESC"]],
  distinct: true, // Important for accurate count with includes
  subQuery: false, // Avoid subquery issues
});

// Return with pagination metadata
res.json({
  success: true,
  data: rows,
  pagination: {
    totalRecords: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: parseInt(pageNo, 10),
    pageSize: parseInt(pageSize, 10),
  },
  message: `Retrieved ${rows.length} records`,
});
```

### Rules

- **Use `findAndCountAll`** for pagination (gets both count + rows in one query)
- **Set `distinct: true`** when including related data
- **Use `Op.between`, `Op.in`, `Op.gt`** for complex filters
- **Always parse `page`, `limit` to integers**
- **Return pagination metadata** for frontend pagination UI

## Create/Update Operations

### Create with Validation

```javascript
const { name } = req.body;

// Validate presence
if (!name) {
  throw new AppError(400, "Sensor name is required");
}

const existed = await Sensor.findOne({ where: { name } });
if (existed) {
  throw new AppError(400, "Sensor already exists");
}

// Create
const sensor = await Sensor.create({ name });
res
  .status(201)
  .json({ success: true, data: sensor, message: "Sensor created" });
```

### Update with Partial Fields

```javascript
const { id } = req.params;
const { name } = req.body;

const sensor = await Sensor.findByPk(id);
if (!sensor) {
  throw new AppError(404, "Sensor not found");
}

if (!name) {
  throw new AppError(400, "Sensor name is required");
}

const existed = await Sensor.findOne({ where: { name } });
if (existed && existed.id !== sensor.id) {
  throw new AppError(400, "Sensor name already exists");
}

// Update only provided fields
await sensor.update({ name });
res.json({ success: true, data: sensor, message: "Sensor updated" });
```

## Soft Deletes (Optional, Not Currently Used)

If you need to preserve deleted records:

```javascript
const Sensor = sequelize.define('Sensor', { ... }, {
  paranoid: true, // Adds deletedAt column
  timestamps: true,
});

// Queries exclude soft-deleted automatically
await Sensor.findAll(); // excludes deletedAt IS NOT NULL

// To include deleted
await Sensor.findAll({ paranoid: false });
```

---

**Checklist before submitting code:**

- [ ] Model attributes stay camelCase; DB column mapping uses `field` when needed
- [ ] Associations defined in `models/associations.js`, not in models
- [ ] Use `as` aliases matching Swagger/controller includes
- [ ] Foreign key names match actual model attributes
- [ ] Eager loading uses `include: { association: 'alias' }`
- [ ] Pagination queries use `findAndCountAll` with `distinct: true`
- [ ] All mutations throw `AppError(statusCode, message)` for validation failures
