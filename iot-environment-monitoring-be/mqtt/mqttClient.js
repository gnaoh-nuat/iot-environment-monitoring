const mqtt = require("mqtt");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");
const { emitSensorData } = require("../socket/socketHandler");
const Action = require("../models/ActionHistory");
const Device = require("../models/Device");
const { Op } = require("sequelize");
const { clearActionTimeout } = require("../services/deviceControlTracker");

const host = process.env.MQTT_HOST || "localhost";
const port = process.env.MQTT_PORT || 2708;
const sensorTopics = (
  process.env.MQTT_TOPIC || "sensor/data,sensors/data,sensors/motion"
)
  .split(",")
  .map((topic) => topic.trim())
  .filter(Boolean);
const commandTopic = process.env.MQTT_COMMAND_TOPIC || "devices/control";
const statusTopic = process.env.MQTT_STATUS_TOPIC || "devices/status";
const syncReqTopic = process.env.MQTT_SYNC_REQ_TOPIC || "devices/sync/req";
const syncResTopic = process.env.MQTT_SYNC_RES_TOPIC || "devices/sync/res";

const socketSensorTopic = process.env.SOCKET_SENSOR_TOPIC || "sensor-data";
const socketDeviceTopic = process.env.SOCKET_DEVICE_TOPIC || "device-status";

const sensorNameMap = {
  temp: "temperature",
  temperature: "temperature",
  hum: "humidity",
  humidity: "humidity",
  lux: "light",
  light: "light",
};

const sensorUnitMap = {
  temperature: "°C",
  humidity: "%",
  light: "Lux",
};

const isSensorTopic = (topic) => sensorTopics.includes(topic);

const normalizeSensorName = (key) => sensorNameMap[key] || null;

const normalizeSensorValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
};

const normalizeActionStatus = (rawStatus) => {
  const normalizedStatus = String(rawStatus || "").toUpperCase();

  if (["DONE", "SUCCESS", "OK"].includes(normalizedStatus)) {
    return "DONE";
  }

  if (["FAILED", "FAIL", "ERROR"].includes(normalizedStatus)) {
    return "FAILED";
  }

  if (["ON", "OFF", "TIMEOUT", "PENDING"].includes(normalizedStatus)) {
    return normalizedStatus;
  }

  return "UNKNOWN";
};

const buildDeviceSyncPayload = async () => {
  const devices = await Device.findAll({ order: [["createdAt", "ASC"]] });
  const latestActions = await Action.findAll({
    where: { status: { [Op.in]: ["ON", "OFF"] } },
    order: [["createdAt", "DESC"]],
  });

  const latestByDeviceId = {};
  latestActions.forEach((action) => {
    const key = String(action.deviceId);
    if (!latestByDeviceId[key]) {
      latestByDeviceId[key] = action;
    }
  });

  return {
    devices: devices.map((device) => {
      const latest = latestByDeviceId[String(device.id)];
      const state = latest ? String(latest.status).toUpperCase() : "OFF";
      return { id: device.id, state };
    }),
    timestamp: new Date().toISOString(),
  };
};

const mqttClient = mqtt.connect(`mqtt://${host}:${port}`, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

mqttClient.on("connect", () => {
  console.log(`[MQTT] Connected to broker at mqtt://${host}:${port}`);

  // Subscribe topic
  mqttClient.subscribe([...sensorTopics, statusTopic, syncReqTopic], (err) => {
    if (err) {
      console.error("[MQTT] Subscribe error:", err);
    } else {
      console.log(
        `[MQTT] Subscribed to: ${[
          ...sensorTopics,
          statusTopic,
          syncReqTopic,
        ].join(", ")}`,
      );
    }
  });
});

// ====== RECEIVE MESSAGE MQTT =======
mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    console.log(`[MQTT] Received from topic: ${topic}`, data);

    if (topic === syncReqTopic) {
      const payload = await buildDeviceSyncPayload();
      mqttClient.publish(
        syncResTopic,
        JSON.stringify(payload),
        { qos: 1 },
        (err) => {
          if (err) {
            console.error("[MQTT] Publish sync response error:", err);
            return;
          }

          console.log(`[MQTT] Sync response sent to ${syncResTopic}`, payload);
        },
      );
      return;
    }

    // 1. SENSOR DATA
    if (isSensorTopic(topic)) {
      const timestamp = data.timestamp || new Date().toISOString();
      const readings = [];

      // Save Database
      for (const key in data) {
        if (key === "timestamp") continue;

        const sensorName = normalizeSensorName(key);
        if (!sensorName) continue;

        const sensorValue = normalizeSensorValue(data[key]);

        const [sensor] = await Sensor.findOrCreate({
          where: { name: sensorName },
          defaults: { name: sensorName },
        });

        const saved = await DataSensor.create({
          sensorId: sensor.id,
          value: String(sensorValue),
        });

        readings.push({
          name: sensorName,
          value: sensorValue,
          unit: sensorUnitMap[sensorName] || null,
          sensorId: sensor.id,
          dataId: saved.id,
        });

        console.log(
          `[DB and SOCKET] Send socket: ${socketSensorTopic} and SAVE DATA SENSOR with ID: ${saved.id}`,
        );
      }

      if (readings.length > 0) {
        emitSensorData(socketSensorTopic, {
          topic,
          timestamp,
          readings,
        });
      }
    }

    //  2. DEVICE STATUS
    if (topic === statusTopic) {
      const timestamp = data.timestamp || new Date().toISOString();
      const { actionId, status } = data;

      if (actionId && status) {
        // ✅ Normalize actionId to number (strict type conversion)
        const normalizedActionId = Number(actionId);
        const actionLookupId = Number.isFinite(normalizedActionId)
          ? normalizedActionId
          : actionId;

        const action = await Action.findByPk(actionLookupId);

        if (action) {
          const normalizedIncomingStatus = normalizeActionStatus(status);
          const waitingStatuses = ["PENDING", "LOADING"];

          if (!waitingStatuses.includes(String(action.status).toUpperCase())) {
            // ✅ Ensure actionId is ALWAYS sent in socket emit (critical fix)
            emitSensorData(socketDeviceTopic, {
              actionId: Number(actionLookupId), // Force number type
              deviceId: Number(action.deviceId), // Ensure number type
              status: action.status,
              targetState: action.status === "ON" ? "ON" : "OFF",
              stale: true,
              timestamp,
            });

            return;
          }

          clearActionTimeout(actionLookupId);

          if (normalizedIncomingStatus === "DONE") {
            const nextStatus =
              String(action.action).toUpperCase() === "ON" ? "ON" : "OFF";
            await action.update({ status: nextStatus });

            emitSensorData(socketDeviceTopic, {
              actionId: Number(actionLookupId),
              deviceId: Number(action.deviceId),
              status: nextStatus,
              targetState: nextStatus,
              error: null,
              timestamp,
            });
            console.log(
              `[DB] Updated ACTION ID ${actionLookupId}: PENDING -> ${nextStatus}`,
            );
          } else {
            const previousAction = await Action.findOne({
              where: {
                deviceId: action.deviceId,
                status: { [Op.in]: ["ON", "OFF"] },
              },
              order: [["createdAt", "DESC"]],
            });
            const revertedStatus = previousAction
              ? previousAction.status
              : "OFF";

            await action.update({ status: revertedStatus });

            emitSensorData(socketDeviceTopic, {
              actionId: Number(actionLookupId),
              deviceId: Number(action.deviceId),
              status: "FAILED",
              targetState: revertedStatus,
              error: data.error || "Thiết bị thực thi thất bại",
              timestamp,
            });
            console.log(
              `[DB] Action FAILED. Reverted ACTION ID ${actionLookupId} status to ${revertedStatus}`,
            );
          }
        } else {
          // ✅ Emit with actionId even when action not found (important for debugging)
          emitSensorData(socketDeviceTopic, {
            actionId: Number(actionLookupId), // Force number type
            status: "FAILED",
            targetState: "OFF",
            error: "Unknown actionId from device ACK",
            timestamp,
          });

          console.log(
            `[SOCKET] WARN: ACK received with unknown actionId ${actionLookupId} on ${socketDeviceTopic}`,
          );
        }
      } else {
        // ⚠️ Fallback when actionId or status missing
        console.warn(
          `[MQTT] Invalid device status payload on ${statusTopic} - missing actionId or status:`,
          data,
        );
        // Don't emit incomplete device-status events
      }
    }
  } catch (err) {
    console.error("[ERROR] Handling MQTT message failed:", err);
  }
});

// ===== PUBLISH COMMAND =====
const publishCommand = (payload) => {
  try {
    mqttClient.publish(
      commandTopic,
      JSON.stringify(payload),
      { qos: 1 },
      (err) => {
        if (err) {
          console.error("[MQTT] Publish error:", err);
        } else {
          console.log(
            `[MQTT] Published to topic: ${commandTopic} | payload:`,
            payload,
          );
        }
      },
    );
  } catch (err) {
    console.error("[MQTT] Publish exception:", err);
  }
};

module.exports = {
  mqttClient,
  publishCommand,
};
