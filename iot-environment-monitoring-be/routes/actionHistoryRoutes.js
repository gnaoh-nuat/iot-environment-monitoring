const express = require("express");
const {
  listActionHistory,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
} = require("../controllers/actionHistoryController");

const router = express.Router();

router.get("/", listActionHistory);
router.post("/", createAction);
router.get("/:id", getActionById);
router.put("/:id", updateAction);
router.delete("/:id", deleteAction);

module.exports = router;
