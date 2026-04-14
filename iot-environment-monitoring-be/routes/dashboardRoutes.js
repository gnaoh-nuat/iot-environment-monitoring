const express = require("express");
const { getDashboardInit } = require("../controllers/dashboardController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard initialization and snapshot APIs
 */

/**
 * @swagger
 * /dashboard/init:
 *   get:
 *     summary: Get dashboard snapshot (devices, actions, sensor histories)
 *     tags: [Dashboard]
 *     description: Fetches all devices, latest action for each device, and sensor history data for dashboard initialization
 *     parameters:
 *       - in: query
 *         name: historyLimit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of recent sensor data points to include per sensor (default 10, max 50)
 *     responses:
 *       200:
 *         description: Dashboard snapshot loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "Light"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     latestActionByDeviceId:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           deviceId:
 *                             type: integer
 *                           action:
 *                             type: string
 *                             enum: [ON, OFF]
 *                           status:
 *                             type: string
 *                             enum: [PENDING, ON, OFF, FAILED, TIMEOUT]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     sensorHistories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sensorName:
 *                             type: string
 *                             enum: [temperature, humidity, light]
 *                           rows:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 sensorId:
 *                                   type: integer
 *                                 value:
 *                                   type: string
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                     snapshotAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when snapshot was taken
 *                 message:
 *                   type: string
 *                   example: "Dashboard snapshot loaded"
 *       500:
 *         description: Server error
 */
router.get("/init", getDashboardInit);

module.exports = router;
