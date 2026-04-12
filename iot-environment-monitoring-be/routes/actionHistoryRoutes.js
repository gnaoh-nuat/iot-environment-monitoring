const express = require("express");
const {
  controlDevice,
  searchActions,
} = require("../controllers/actionHistoryController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Actions
 *   description: Device control APIs
 */

/**
 * @swagger
 * /actions/control:
 *   post:
 *     summary: Control device (ON/OFF)
 *     tags: [Actions]
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
 *       200:
 *         description: Command sent successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.post("/control", controlDevice);

/**
 * @swagger
 * /actions/search:
 *   get:
 *     summary: Search actions (pagination, filter, sort)
 *     tags: [Actions]
 *     parameters:
 *       - in: query
 *         name: pageNo
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, action, status, createdAt, deviceName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: deviceName
 *         schema:
 *           type: string
 *           example: den phong khach
 *       - in: query
 *         name: searchBy
 *         schema:
 *           type: string
 *           enum: [id, action, status, deviceName, time]
 *       - in: query
 *         name: searchValue
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get("/search", searchActions);

module.exports = router;
