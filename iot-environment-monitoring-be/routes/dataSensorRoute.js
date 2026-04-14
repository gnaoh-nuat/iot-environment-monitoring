const express = require("express");

const {
  getDataSensorHistory,
  searchDataSensors,
} = require("../controllers/dataSensorController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Data Sensors
 *   description: Data Sensor data APIs
 */

/**
 * @swagger
 * /data-sensors/history:
 *   get:
 *     summary: Get Data sensor history by sensor name
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: sensorName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of sensor (temperature, humidity, light)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records (default 20)
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/history", getDataSensorHistory);

/**
 * @swagger
 * /data-sensors/search:
 *   get:
 *     summary: Search sensor data with pagination, filter, sort and free-text query
 *     tags: [Data Sensors]
 *     parameters:
 *       - in: query
 *         name: pageNo
 *         schema:
 *           type: integer
 *           example: 1
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, value, createdAt]
 *
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *
 *       - in: query
 *         name: sensorName
 *         schema:
 *           type: string
 *           example: temperature
 *         description: Filter by sensor name (temperature, humidity, light)
 *
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free-text query, backend auto-detects time, id, sensor name or value
 *
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start datetime filter
 *
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End datetime filter
 *
 *       - in: query
 *         name: searchBy
 *         schema:
 *           type: string
 *           enum: [id, value, name, time]
 *
 *       - in: query
 *         name: searchValue
 *         schema:
 *           type: string
 *         description: Legacy search value (kept for compatibility)
 *
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid date/time filter
 */
router.get("/search", searchDataSensors);

module.exports = router;
