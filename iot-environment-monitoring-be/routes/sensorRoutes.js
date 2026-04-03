const express = require("express");
const {
  listSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
  listSensorDataBySensor,
  createSensorData,
} = require("../controllers/sensorController");

const router = express.Router();

router.get("/", listSensors);
router.post("/", createSensor);
router.get("/:id", getSensorById);
router.put("/:id", updateSensor);
router.delete("/:id", deleteSensor);

router.get("/:id/data", listSensorDataBySensor);
router.post("/:id/data", createSensorData);

module.exports = router;
