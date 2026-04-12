const express = require("express");
const router = express.Router();

const {
  createSensor,
  getAllSensors,
  getSensorById,
  updateSensor,
  deleteSensor,
} = require("../controllers/sensorController");

/**
 * @swagger
 * tags:
 *   name: Sensors
 *   description: Sensor management APIs
 */

/**
 * @swagger
 * /sensors:
 *   post:
 *     summary: Create new sensor
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: temperature
 *     responses:
 *       201:
 *         description: Sensor created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: temperature
 *                 createdAt: 2026-03-30T15:51:02.510Z
 *                 updatedAt: 2026-03-30T15:51:02.510Z
 *       400:
 *         description: Bad request (missing name or duplicate)
 *       500:
 *         description: Internal server error
 */
router.post("/", createSensor);

/**
 * @swagger
 * /sensors:
 *   get:
 *     summary: Get all sensors
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: List of sensors
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   name: temperature
 *                   createdAt: 2026-03-30T15:51:02.510Z
 *                 - id: 2
 *                   name: humidity
 *                   createdAt: 2026-03-30T15:52:00.000Z
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllSensors);

/**
 * @swagger
 * /sensors/{id}:
 *   get:
 *     summary: Get sensor by ID
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Sensor found
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: temperature
 *                 createdAt: 2026-03-30T15:51:02.510Z
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getSensorById);

/**
 * @swagger
 * /sensors/{id}:
 *   put:
 *     summary: Update sensor
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: humidity
 *     responses:
 *       200:
 *         description: Sensor updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: humidity
 *       400:
 *         description: Bad request (missing name or duplicate)
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateSensor);

/**
 * @swagger
 * /sensors/{id}:
 *   delete:
 *     summary: Delete sensor
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Sensor deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Sensor deleted successfully
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteSensor);

module.exports = router;
