const express = require("express");
const {
  searchActions,
  getDeviceManagementDailyStats,
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
 * /actions/search:
 *   get:
 *     summary: Search action history with pagination, filter and free-text query
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
 *           default: 10
 *           minimum: 1
 *       - in: query
 *         name: deviceName
 *         schema:
 *           type: string
 *         description: Exact device name filter
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [ON, OFF]
 *         description: Action filter
 *       - in: query
 *         name: statusGroup
 *         schema:
 *           type: string
 *           enum: [success, failure, pending]
 *         description: success if action=status in ON/OFF, failure for other non-pending statuses
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free-text query, backend auto-detects date, id, device, action, status
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order for selected sortBy column
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, deviceName, action, createdAt, status]
 *           default: createdAt
 *         description: Sort field
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid query/filter input
 *       500:
 *         description: Internal server error
 */
router.get("/search", searchActions);

/**
 * @swagger
 * /actions/device-management/daily:
 *   get:
 *     summary: Get daily successful ON/OFF counts for Device Management page
 *     tags: [Actions]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-04-20
 *         description: Selected day in YYYY-MM-DD
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: Asia/Ho_Chi_Minh
 *           example: Asia/Ho_Chi_Minh
 *         description: IANA timezone used when grouping records by day
 *     responses:
 *       200:
 *         description: Daily ON/OFF stats loaded successfully
 *       400:
 *         description: Invalid date or timezone
 *       500:
 *         description: Internal server error
 */
router.get("/device-management/daily", getDeviceManagementDailyStats);

module.exports = router;
