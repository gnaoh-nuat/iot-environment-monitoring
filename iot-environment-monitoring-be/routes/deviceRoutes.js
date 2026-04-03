const express = require("express");
const {
  listDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
} = require("../controllers/deviceController");

const router = express.Router();

router.get("/", listDevices);
router.post("/", createDevice);
router.get("/:id", getDeviceById);
router.put("/:id", updateDevice);
router.delete("/:id", deleteDevice);

module.exports = router;
