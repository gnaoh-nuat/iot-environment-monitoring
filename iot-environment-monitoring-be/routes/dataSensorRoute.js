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
 *     summary: Get & search data sensors (pagination, filter, sort)
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
 *           example: 10
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
 *
 *       - in: query
 *         name: sensorName
 *         schema:
 *           type: string
 *           example: temperature
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
 *           example: 28
 *
 *
 *
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/search", searchDataSensors);

module.exports = router;
