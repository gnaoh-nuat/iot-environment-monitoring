const express = require("express");

const dataSensorRouter = require("./dataSensorRoute");
const actionRouter = require("./actionHistoryRoutes");
const deviceRouter = require("./deviceRoutes");
const sensorRouter = require("./sensorRoutes");

const router = express.Router();

router.use("/data-sensors", dataSensorRouter);

router.use("/actions", actionRouter);

router.use("/devices", deviceRouter);

router.use("/sensors", sensorRouter);

module.exports = router;
