const express = require("express");
const {
  controlDeviceFromDashboard,
} = require("../controllers/deviceController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DeviceControl
 *   description: Device control APIs for realtime dashboard flow
 */

/**
 * @swagger
 * /device/control:
 *   post:
 *     summary: Send device control command and wait for hardware acknowledgment
 *     tags: [DeviceControl]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - action
 *             properties:
 *               deviceId:
 *                 type: integer
 *                 example: 1
 *               action:
 *                 type: string
 *                 enum: [ON, OFF]
 *                 example: ON
 *     responses:
 *       202:
 *         description: Command accepted and processing
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
 *                     actionId:
 *                       type: integer
 *                       example: 101
 *                     deviceId:
 *                       type: integer
 *                       example: 1
 *                     action:
 *                       type: string
 *                       enum: [ON, OFF]
 *                       example: ON
 *                     status:
 *                       type: string
 *                       enum: [PENDING]
 *                       example: PENDING
 *                 message:
 *                   type: string
 *                   example: Dang xu ly
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Device not found
 *       409:
 *         description: Device already has a pending command
 */
router.post("/control", controlDeviceFromDashboard);

module.exports = router;
