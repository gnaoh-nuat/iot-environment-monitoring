const mqtt = require("mqtt");
const { handleSensorData } = require("./handlers/sensorHandler");
const { handleDeviceAck } = require("./handlers/deviceHandler");
const { handleSyncRequest } = require("./handlers/syncHandler");

const host = process.env.MQTT_HOST || "localhost";
const port = process.env.MQTT_PORT || 2708;

const sensorTopics = (
  process.env.MQTT_TOPIC || "sensor/data,sensors/data,sensors/motion"
)
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);
const commandTopic = process.env.MQTT_COMMAND_TOPIC || "devices/control";
const statusTopic = process.env.MQTT_STATUS_TOPIC || "devices/status";
const syncReqTopic = process.env.MQTT_SYNC_REQ_TOPIC || "devices/sync/req";
const syncResTopic = process.env.MQTT_SYNC_RES_TOPIC || "devices/sync/res";

// 1. Tối ưu: Gom mảng subscribe 1 lần duy nhất
const subscribeTopics = [...sensorTopics, statusTopic, syncReqTopic];

const mqttClient = mqtt.connect(`mqtt://${host}:${port}`, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

mqttClient.on("connect", () => {
  console.log(`[MQTT] Connected to broker at mqtt://${host}:${port}`);

  mqttClient.subscribe(subscribeTopics, (err) => {
    if (err) console.error("[MQTT] Subscribe error:", err);
    else console.log(`[MQTT] Subscribed to: ${subscribeTopics.join(", ")}`);
  });
});

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`[MQTT] Received from topic: ${topic}`, data);

    // 2. Tối ưu: Định tuyến đi thẳng vấn đề, bỏ hàm isSensorTopic thừa
    if (topic === syncReqTopic)
      return handleSyncRequest(mqttClient, syncResTopic);
    if (topic === statusTopic) return handleDeviceAck(data);
    if (sensorTopics.includes(topic)) return handleSensorData(topic, data);
  } catch (err) {
    console.error("[ERROR] Handling MQTT message failed:", err);
  }
});

// ===== PUBLISH COMMAND =====
const publishCommand = (payload) => {
  // 3. Tối ưu: Bỏ try-catch thừa, dùng thẳng callback của MQTT
  mqttClient.publish(
    commandTopic,
    JSON.stringify(payload),
    { qos: 1 },
    (err) => {
      if (err) console.error("[MQTT] Publish error:", err);
      else
        console.log(
          `[MQTT] Published to topic: ${commandTopic} | payload:`,
          payload,
        );
    },
  );
};

module.exports = {
  mqttClient,
  publishCommand,
};
