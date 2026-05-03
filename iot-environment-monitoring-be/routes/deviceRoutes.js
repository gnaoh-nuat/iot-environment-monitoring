const express = require("express");
const router = express.Router();

const {
  createDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  controlDeviceFromDashboard,
} = require("../controllers/deviceController");

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management and control APIs
 */

/**
 * @swagger
 * /devices/control:
 *   post:
 *     summary: Send device control command and wait for hardware acknowledgment
 *     tags: [Devices]
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
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Device not found
 *       409:
 *         description: Device already has a pending command
 */
router.post("/control", controlDeviceFromDashboard);

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Create new device
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Living Room Light"
 *     responses:
 *       201:
 *         description: Device created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: "Living Room Light"
 *       400:
 *         description: Missing device name
 */
router.post("/", createDevice);

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   name: "Light"
 *                 - id: 2
 *                   name: "Fan"
 */
router.get("/", getAllDevices);

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Device found
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: "Light"
 *       404:
 *         description: Device not found
 */
router.get("/:id", getDeviceById);

/**
 * @swagger
 * /devices/{id}:
 *   put:
 *     summary: Update device
 *     tags: [Devices]
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
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Device Name"
 *     responses:
 *       200:
 *         description: Device updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: "Updated Device Name"
 *       404:
 *         description: Device not found
 */
router.put("/:id", updateDevice);

/**
 * @swagger
 * /devices/{id}:
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Device deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Device deleted"
 *       404:
 *         description: Device not found
 */
router.delete("/:id", deleteDevice);

module.exports = router;
