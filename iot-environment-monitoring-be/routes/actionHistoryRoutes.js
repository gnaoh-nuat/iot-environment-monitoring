const express = require("express");
const { searchActions } = require("../controllers/actionHistoryController");

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
 *     summary: Search action history with pagination, filter, sort and free-text query
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
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, action, status, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start datetime filter
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End datetime filter
 *       - in: query
 *         name: searchBy
 *         schema:
 *           type: string
 *           enum: [id, action, status, deviceName, time]
 *       - in: query
 *         name: searchValue
 *         schema:
 *           type: string
 *         description: Legacy search value (kept for compatibility)
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid query/filter input
 *       500:
 *         description: Internal server error
 */
router.get("/search", searchActions);

module.exports = router;
