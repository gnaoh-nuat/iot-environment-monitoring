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
 *     summary: Search sensor data with pagination, sensor filter and scoped query by value/time
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
 *         description: Search text in selected searchType field
 *
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [value, time]
 *           default: value
 *         description: Select which column to search
 *
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order for selected sortBy column
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, sensorName, value, createdAt]
 *           default: createdAt
 *         description: Sort field
 *
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid searchType, sortOrder or sortBy
 */
router.get("/search", searchDataSensors);

module.exports = router;
