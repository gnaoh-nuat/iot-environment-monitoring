---
description: "Use when creating or modifying REST endpoints, controllers, or adding API documentation. Ensures Swagger JSDoc stays synchronized with implementation, consistent error handling, and proper response formats."
applyTo:
  - "iot-environment-monitoring-be/routes/**/*.js"
  - "iot-environment-monitoring-be/controllers/**/*.js"
---

# Backend API Patterns

## Core Contracts

- Success responses must use `{ success, data, message }`.
- Errors should be passed to middleware with `next(err)`.
- Use `new AppError(statusCode, message)` for operational errors.
- Frontend `api` service unwraps Axios responses to `response.data`, so keep response shape consistent.

## Swagger JSDoc Format (Critical)

**Every endpoint must have JSDoc comments that exactly match the implementation.** Mismatches cause Swagger UI to be misleading.

### Template

```javascript
/**
 * @swagger
 * /sensors:
 *   get:
 *     summary: Get all sensors
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *                 message: { type: string }
 *       500:
 *         description: Internal server error
 *       400:
 *         description: Bad request
 */
router.get("/", sensorController.getAllSensors);
```

### Rules

- **Match params exactly**: If code has `req.query.page`, JSDoc must document it
- **Match response codes**: If controller can throw 400, 404, 500, document all
- **Update JSDoc when modifying code**: No lazy comments; they're API contracts
- **Use tags consistently**: [Sensors], [Devices], [Actions], [Data Sensors]
- **List all response fields**: `success`, `data`, `message` always present

## Controller Error Handling

**Always throw `AppError(statusCode, message)` for consistency.**

### Pattern

```javascript
// iot-environment-monitoring-be/controllers/sensorController.js
const AppError = require("../utils/appError");

exports.getSensorById = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      throw new AppError(404, "Sensor not found");
    }
    res.json({
      success: true,
      data: sensor,
      message: "Retrieved successfully",
    });
  } catch (error) {
    next(error); // Pass to errorHandler middleware
  }
};
```

### Rules

- Throw `AppError` with status code + message
- Never send response directly in catch blocks
- Use 400 (bad input), 404 (not found), 409 (conflict), 500 (unexpected)
- Pass errors to `next()` for global middleware to format

## API Response Format

**All endpoints must return this exact structure:**

```json
{
  "success": true/false,
  "data": {} or [] or null,
  "message": "Human-readable description"
}
```

Note: Error middleware also adds `status` (`fail` or `error`) in error responses.

### Examples

✅ **Success**

```javascript
res.json({ success: true, data: sensors, message: "All sensors retrieved" });
res
  .status(201)
  .json({ success: true, data: newSensor, message: "Sensor created" });
```

❌ **Wrong (will break frontend)**

```javascript
res.json(sensors); // Missing structure
res.json({ sensors, total: 10 }); // Missing success, message
```

## Sequelize Query Patterns

### Eager Loading with Aliases

```javascript
// models/associations.js defines: Sensor.hasMany(SensorData, { as: 'dataLogs' })

const sensors = await Sensor.findAll({
  include: { association: "dataLogs", required: false },
  // Use 'association' key (matches the 'as' alias from associations.js)
});
```

Current aliases in this project:

- `Sensor -> SensorData`: `dataLogs`
- `SensorData -> Sensor`: `sensorInfo`
- `Device -> ActionHistory`: `actionLogs`
- `ActionHistory -> Device`: `deviceInfo`

### Filtering & Pagination

```javascript
const { pageNo = 1, pageSize = 10, sensorId, startDate, endDate } = req.query;
const offset = (pageNo - 1) * pageSize;

const query = {};
if (sensorId) query.sensorId = sensorId;
if (startDate && endDate) {
  query.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
}

const { count, rows } = await SensorData.findAndCountAll({
  where: query,
  offset,
  limit: pageSize,
  order: [["createdAt", "DESC"]],
  include: [{ association: "sensorInfo", required: true }],
  distinct: true,
  subQuery: false,
});

res.json({
  success: true,
  data: rows,
  message: `Retrieved ${rows.length} records`,
  pagination: {
    totalRecords: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: pageNo,
    pageSize,
  },
});
```

## Route Organization

- **One file per resource**: `sensorRoutes.js`, `deviceRoutes.js`, `dataSensorRoute.js`, `actionHistoryRoutes.js`
- **Import and mount in index.js**: `router.use('/sensors', sensorRoutes)`
- **Endpoint naming**: Use kebab-case URLs (`/data-sensors/search`, not `/dataSensors`)
- **Method stacking**: Group same resource with different methods
  ```javascript
  router.get("/", sensorController.getAllSensors);
  router.post("/", sensorController.createSensor);
  router.patch("/:id", sensorController.updateSensor);
  router.delete("/:id", sensorController.deleteSensor);
  ```

## Validation

Use `req.body` validation before passing to controller. Throw 400 with clear message:

```javascript
const { name, type } = req.body;
if (!name || !type) {
  throw new AppError(400, "name and type are required");
}
```

---

**Checklist before submitting code:**

- [ ] JSDoc comments match implementation (parameters, responses, status codes)
- [ ] All errors thrown as `AppError(code, message)`
- [ ] All responses follow `{ success, data, message }` format
- [ ] Eager loading uses `association` key matching `models/associations.js`
- [ ] Run `npm run dev` and test at `http://localhost:5000/api-docs`
