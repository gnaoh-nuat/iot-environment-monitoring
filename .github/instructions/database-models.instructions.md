---
description: "Use when defining Sequelize models, setting up associations, or writing database queries. Ensures proper foreign keys, eager loading, and cascade behaviors."
applyTo: "iot-environment-monitoring-be/models/**/*.js"
---

# Database Models (Sequelize)

## Model Definition Template

```javascript
// iot-environment-monitoring-be/models/Sensor.js
module.exports = (sequelize, DataTypes) => {
  const Sensor = sequelize.define(
    "Sensor",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM("temperature", "humidity", "light"),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(20),
        defaultValue: "C", // Celsius, %, Lux, etc.
      },
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Device",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      timestamps: true, // Adds createdAt, updatedAt
      tableName: "sensors",
    },
  );

  return Sensor;
};
```

### Rules

- **Use snake_case** in database column names (`device_id`, not `deviceId`)
- **Sequelize automatically creates camelCase accessors** (`sensor.deviceId` in code)
- **Always set `timestamps: true`** (createdAt, updatedAt tracked automatically)
- **Use `ENUM`** for fixed choices (sensor types, device statuses)
- **Set `allowNull: false`** for required fields
- **Use `unique: true`** for naturally unique fields (sensor name, email)

## Associations (Critical)

**All associations defined in `models/associations.js`—never in individual model files.**

```javascript
// iot-environment-monitoring-be/models/associations.js
module.exports = (models) => {
  const { Device, Sensor, SensorData, ActionHistory } = models;

  // Device (1) ──── (n) Sensor
  Device.hasMany(Sensor, {
    foreignKey: "deviceId",
    as: "sensorList", // Alias for includes
    onDelete: "CASCADE",
  });
  Sensor.belongsTo(Device, {
    foreignKey: "deviceId",
    as: "deviceInfo",
  });

  // Sensor (1) ──── (n) SensorData
  Sensor.hasMany(SensorData, {
    foreignKey: "sensorId",
    as: "sensorData",
    onDelete: "CASCADE",
  });
  SensorData.belongsTo(Sensor, {
    foreignKey: "sensorId",
    as: "sensorInfo",
  });

  // Device (1) ──── (n) ActionHistory
  Device.hasMany(ActionHistory, {
    foreignKey: "deviceId",
    as: "actionHistory",
    onDelete: "CASCADE",
  });
  ActionHistory.belongsTo(Device, {
    foreignKey: "deviceId",
    as: "deviceInfo",
  });
};
```

### Rules

- **Use `as` alias consistently**: Frontend/controllers reference this (`include: { as: 'sensorList' }`)
- **Match `foreignKey` to model attribute**: If model has `deviceId`, use `foreignKey: 'deviceId'`
- **Set `onDelete: 'CASCADE'` for cascading deletes**: Deleting parent also deletes children
- **Both sides of relationship**: `hasMany` + `belongsTo` on both models

## Querying with Eager Loading

### ✅ Correct (Using Associations)

```javascript
// Include related data using the 'as' alias
const devices = await Device.findAll({
  include: { association: "sensorList", required: false },
  // 'sensorList' matches the 'as' in associations.js
  order: [["createdAt", "DESC"]],
});

// Result: { id, name, sensorList: [ { id, name, type }, ... ] }
```

### ❌ Wrong

```javascript
// Raw SQL or querying separately (inefficient/inconsistent)
const devices = await Device.findAll();
const sensors = await Sensor.findAll({ where: { deviceId: devices[0].id } });

// Or: Wrong alias name
const devices = await Device.findAll({
  include: { as: "sensors" }, // Should be 'sensorList'
});
```

## Filtering, Pagination & Sorting

```javascript
const {
  page = 1,
  limit = 10,
  sensorId,
  startDate,
  endDate,
  sort = "DESC",
} = req.query;
const offset = (page - 1) * limit;

// Build WHERE clause
const where = {};
if (sensorId) where.sensorId = parseInt(sensorId);
if (startDate && endDate) {
  where.createdAt = {
    [sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
  };
}

// Query with pagination
const { count, rows } = await SensorData.findAndCountAll({
  where,
  include: { association: "sensorInfo", required: false },
  offset,
  limit: parseInt(limit),
  order: [["createdAt", sort === "ASC" ? "ASC" : "DESC"]],
  distinct: true, // Important for accurate count with includes
  subQuery: false, // Avoid subquery issues
});

// Return with pagination metadata
res.json({
  success: true,
  data: rows,
  pagination: {
    page: parseInt(page),
    limit: parseInt(limit),
    total: count,
    pages: Math.ceil(count / limit),
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
const { name, type, deviceId } = req.body;

// Validate presence
if (!name || !type || !deviceId) {
  throw new AppError("name, type, and deviceId are required", 400);
}

// Validate foreign key exists
const device = await Device.findByPk(deviceId);
if (!device) {
  throw new AppError("Device not found", 404);
}

// Create
const sensor = await Sensor.create({ name, type, deviceId });
res
  .status(201)
  .json({ success: true, data: sensor, message: "Sensor created" });
```

### Update with Partial Fields

```javascript
const { id } = req.params;
const { name, type } = req.body;

const sensor = await Sensor.findByPk(id);
if (!sensor) {
  throw new AppError("Sensor not found", 404);
}

// Update only provided fields
await sensor.update({ name, type });
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

- [ ] Model uses snake_case columns (sequelize auto-creates camelCase accessors)
- [ ] Associations defined in `models/associations.js`, not in models
- [ ] Use `as` aliases matching Swagger/controller includes
- [ ] Foreign key names match actual model attributes
- [ ] Eager loading uses `include: { association: 'alias' }`
- [ ] Pagination queries use `findAndCountAll` with `distinct: true`
- [ ] All mutations throw `AppError` for validation failures
