const mqtt = require("mqtt");
const DataSensor = require("../models/SensorData");
const Sensor = require("../models/Sensor");
const { emitSensorData } = require("../socket/socketHandler");
const Action = require("../models/ActionHistory");

let ioRef;

const host = process.env.MQTT_HOST || "localhost";
const port = process.env.MQTT_PORT || 2708;
const sensorTopic = process.env.MQTT_TOPIC || "sensors/motion";
const commandTopic = process.env.MQTT_COMMAND_TOPIC || "command/device";
const statusTopic = process.env.MQTT_STATUS_TOPIC || "devices/status";

const socketSensorTopic = process.env.SOCKET_SENSOR_TOPIC || "sensor-data";
const socketDeviceTopic = process.env.SOCKET_DEVICE_TOPIC || "device-status";

const mqttClient = mqtt.connect(`mqtt://${host}:${port}`, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

mqttClient.on("connect", () => {
  console.log(`[MQTT] Connected to broker at mqtt://${host}:${port}`);

  // Subscribe topic
  mqttClient.subscribe([sensorTopic, statusTopic], (err) => {
    if (err) {
      console.error("[MQTT] Subscribe error:", err);
    } else {
      console.log(`[MQTT] Subscribed to: ${sensorTopic}, ${statusTopic}`);
    }
  });
});

// ====== RECEIVE MESSAGE MQTT =======
mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    console.log(`[MQTT] Received from topic: ${topic}`, data);

    // 1. SENSOR DATA
    if (topic === sensorTopic) {
      // Save Database
      for (const key in data) {
        if (key === "timestamp") continue;

        const sensorName = key;
        const sensorValue = data[key];

        let sensor = await Sensor.findOne({ where: { name: sensorName } });

        if (!sensor) {
          sensor = await Sensor.create({ name: sensorName });
        }

        const saved = await DataSensor.create({
          sensorId: sensor.id,
          value: sensorValue.toString(),
        });

        // Emit realtime Socket.io
        emitSensorData(socketSensorTopic, data);

        console.log(
          `[DB and SOCKET] Send socket: ${socketSensorTopic} and SAVE DATA SENSOR with ID: ${saved.id}`,
        );
      }
    }

    //  2. DEVICE STATUS
    if (topic === statusTopic) {
      const { actionId, status } = data;

      const action = await Action.findByPk(actionId);

      if (action) {
        await action.update({ status });

        emitSensorData(socketDeviceTopic, {
          actionId,
          deviceId: action.deviceId,
          status,
        });

        console.log(
          `[DB and SOCKET] Send socket: ${socketDeviceTopic} and UPDATE ACTION with ID: ${actionId}`,
        );
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
  setSocket: (io) => {
    ioRef = io;
    console.log("[Socket.io] Socket reference set for MQTT emitter");
  },
};
