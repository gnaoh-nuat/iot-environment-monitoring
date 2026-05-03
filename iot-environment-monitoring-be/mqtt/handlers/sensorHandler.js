const { Sensor, DataSensor } = require("../../models");
const { emitSensorData } = require("../../socket/socketHandler");

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

// 1. TỐI ƯU: In-memory cache để không phải gọi DB tìm Sensor ID mỗi giây
const sensorIdCache = {};
const getSensorId = async (name) => {
  if (sensorIdCache[name]) return sensorIdCache[name];
  const [sensor] = await Sensor.findOrCreate({ where: { name } });
  sensorIdCache[name] = sensor.id;
  return sensor.id;
};

const handleSensorData = async (topic, data) => {
  const timestamp = data.timestamp || new Date().toISOString();

  // 2. TỐI ƯU: Lọc và chuẩn hóa dữ liệu đầu vào thành một mảng sạch
  const validEntries = Object.entries(data)
    .filter(([key]) => key !== "timestamp" && sensorNameMap[key])
    .map(([key, rawValue]) => {
      const numValue = Number(rawValue);
      return {
        name: sensorNameMap[key],
        value: Number.isFinite(numValue) ? numValue : rawValue,
      };
    });

  if (validEntries.length === 0) return;

  // 3. TỐI ƯU: Chạy lưu DB song song (Promise.all) thay vì chờ tuần tự từng cảm biến
  const readings = await Promise.all(
    validEntries.map(async ({ name, value }) => {
      const sensorId = await getSensorId(name);
      const saved = await DataSensor.create({ sensorId, value: String(value) });

      return {
        name,
        value,
        unit: sensorUnitMap[name] || null,
        sensorId,
        dataId: saved.id,
      };
    }),
  );

  // 4. Phát ra Socket 1 lần duy nhất sau khi lưu xong toàn bộ
  const socketTopic = process.env.SOCKET_SENSOR_TOPIC || "sensor-data";
  emitSensorData(socketTopic, { topic, timestamp, readings });

  console.log(
    `[DB & SOCKET] Saved & Emitted ${readings.length} metrics to ${socketTopic}`,
  );
};

module.exports = {
  handleSensorData,
};
