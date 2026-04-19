---
description: "Use when implementing real-time features, setting up Socket.io listeners/emitters, or configuring MQTT device communication. Ensures proper event naming, message formatting, and connection lifecycle."
applyTo:
  [
    "iot-environment-monitoring-be/socket/**/*.js",
    "iot-environment-monitoring-be/mqtt/**/*.js",
    "iot-environment-monitoring-fe/src/hooks/useSensorSocket.js",
    "iot-environment-monitoring-fe/src/hooks/useWebSocket.js",
  ]
---

# Real-Time Integration (Socket.io & MQTT)

## Current Runtime Sources

- MQTT broker host/port are read from `.env` (`MQTT_HOST`, `MQTT_PORT`).
- Sensor topics are comma-separated via `MQTT_TOPIC`.
- Backend emits Socket.io events from env (`SOCKET_SENSOR_TOPIC`, `SOCKET_DEVICE_TOPIC`).
- Frontend listens with `VITE_SOCKET_URL`, `VITE_SOCKET_SENSOR_EVENT`, `VITE_SOCKET_DEVICE_EVENT`.

## Data Flow Architecture

```
IoT Devices (MQTT)
    ↓
MQTT Broker (env-driven host:port)
    ↓
Backend MQTT Client (mqtt/mqttClient.js)
    ↓ Subscribe & Parse
Database Update (PostgreSQL)
    ↓ Socket.io Emit
Frontend Socket.io Listener (useSensorSocket.js)
    ↓
React Component (setState triggers re-render)
```

## Backend: MQTT Client Setup

### Connection & Subscription Pattern

```javascript
// iot-environment-monitoring-be/mqtt/mqttClient.js
const mqtt = require("mqtt");

const host = process.env.MQTT_HOST || "localhost";
const port = process.env.MQTT_PORT || 2708;
const sensorTopics = (process.env.MQTT_TOPIC || "sensor/data,sensors/data")
  .split(",")
  .map((topic) => topic.trim())
  .filter(Boolean);

const client = mqtt.connect(`mqtt://${host}:${port}`, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 5000,
});

client.on("connect", () => {
  console.log("[MQTT] connected");
  client.subscribe(sensorTopics, (err) => {
    if (err) console.error(err);
  });
});

client.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    // payload parsing and DB write

    emitSensorData(process.env.SOCKET_SENSOR_TOPIC || "sensor-data", {
      topic,
      timestamp: payload.timestamp || new Date().toISOString(),
      readings: [],
    });
  } catch (error) {
    console.error("[MQTT] parse error:", error);
  }
});

client.on("error", (error) => {
  console.error("[MQTT] error:", error);
  // Reconnect handled by reconnectPeriod
});

module.exports = client;
```

### Rules

- **Topic naming**: Use forward slashes for hierarchy (`sensors/123/data`, `devices/456/status`)
- **Topic list support**: Keep `MQTT_TOPIC` as comma-separated values and trim whitespace.
- **Always wrap in try-catch**: MQTT messages may have invalid JSON
- **Parse and validate** before saving to database
- **Emit to Socket.io after database save** (frontend sees confirmed data)

## Backend: Socket.io Event Handlers

### Connection & Listener Pattern

```javascript
// iot-environment-monitoring-be/socket/socketHandler.js
let ioRef = null;

function initSocket(server) {
  const io = require("socket.io")(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Frontend connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Frontend disconnected: ${socket.id}`);
    });
  });

  ioRef = io;
  return io;
}

function emitSensorData(topic, data) {
  if (ioRef) {
    ioRef.emit(topic, data);
  }
}

module.exports = { initSocket, emitSensorData };
```

### Event Naming Conventions

- Sensor stream default: `sensor-data`
- Device stream default: `device-status`
- Read event names from env first, then fallback to defaults
- Keep topic names kebab-case and stable

### Rules

- Use `emitSensorData(topic, payload)` helper from `socketHandler.js`.
- Ensure `actionId`, `deviceId` are number-like when sending device-status payloads.
- Emit stale/timeout/failure states explicitly so frontend can reconcile UI state.

## Frontend: Socket.io Listener Hook

### useSensorSocket Pattern

```javascript
// iot-environment-monitoring-fe/src/hooks/useSensorSocket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SENSOR_EVENT = import.meta.env.VITE_SOCKET_SENSOR_EVENT || "sensor-data";
const DEVICE_EVENT =
  import.meta.env.VITE_SOCKET_DEVICE_EVENT || "device-status";

export const useSensorSocket = () => {
  const [connected, setConnected] = useState(false);
  const [lastSensorPacket, setLastSensorPacket] = useState(null);
  const [lastDevicePacket, setLastDevicePacket] = useState(null);

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      },
    );

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on(SENSOR_EVENT, (packet) => setLastSensorPacket(packet));
    socket.on(DEVICE_EVENT, (packet) => setLastDevicePacket(packet));

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => socket.disconnect();
  }, []);

  return { connected, lastSensorPacket, lastDevicePacket };
};
```

### Usage in Component

```javascript
import { useSensorSocket } from "../hooks/useSensorSocket";

export default function Dashboard() {
  const { lastSensorPacket } = useSensorSocket();

  useEffect(() => {
    if (lastSensorPacket?.readings) {
      // Updated in real-time when MQTT data arrives
      // map readings to UI state
    }
  }, [lastSensorPacket]);

  return <Dashboard data={sensors} />;
}
```

### Rules

- Prefer shared socket lifecycle to avoid opening multiple redundant connections.
- Register and unregister listeners in cleanup.
- Keep connection status in UI (`connected` + `error`).
- Do not hard-code event names when env variables already define them.

## Device Control Flow (Current Project Pattern)

```javascript
// Frontend calls REST API instead of emitting socket command directly
await api.post("/actions/control", {
  deviceId,
  action: "ON",
});

// Backend will:
// 1) Create pending action in DB
// 2) Publish MQTT command
// 3) Emit socket updates on device-status topic
```

### Rules

- Validate action input on frontend (`ON` / `OFF`) before calling API.
- Keep socket listeners passive for status updates; do not open one-off sockets for commands.
- Handle `PENDING`, `ON`, `OFF`, `FAILED`, `TIMEOUT` states in UI.
- Always rely on socket status events for final state reconciliation.

## Message Format Standards

### Sensor Data Event (MQTT → Backend → Frontend)

```javascript
// MQTT payload from device
{
  temp: 25.5,
  hum: 60,
  lux: 300,
  timestamp: '2024-04-13T10:30:00Z'
}

// Backend Socket.io emission
io.emit('sensor-data', {
  topic: 'sensor/data',
  timestamp: '2024-04-13T10:30:00Z',
  readings: [
    { name: 'temperature', value: 25.5, unit: '°C', sensorId: 1, dataId: 10 },
  ],
});
```

### Control Event (Frontend REST → Backend → MQTT → Socket)

```javascript
// Frontend REST request
await api.post("/actions/control", {
  deviceId: 5,
  action: "ON",
});

// Backend MQTT publish payload
publishCommand({
  actionId: 123,
  deviceId: 5,
  action: "ON",
  timestamp: new Date().toISOString(),
});
```

Current flow in this codebase:

- Frontend calls `POST /actions/control`.
- Backend persists pending action, publishes MQTT command, and emits socket updates.

## Error Handling & Reconnection

### Backend: Reconnect Logic

```javascript
client.on("error", (error) => {
  console.error("❌ MQTT Error:", error.message);
  // Automatically reconnects per reconnectPeriod setting
});

// Check connection before publishing
const publishToMQTT = (topic, message) => {
  if (client.connected) {
    client.publish(topic, JSON.stringify(message));
  } else {
    console.warn("⚠ MQTT not connected, queuing message");
    // Implement message queue if needed
  }
};
```

### Frontend: Connection Status UI

```javascript
export default function Dashboard() {
  const { connected } = useSensorSocket();

  return (
    <div>
      <div
        className={`inline-block w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
      />
      {connected ? "Live" : "Reconnecting..."}
    </div>
  );
}
```

---

**Checklist before submitting code:**

- [ ] MQTT subscription uses env-configured topic list (`MQTT_TOPIC`)
- [ ] All MQTT messages wrapped in try-catch and JSON validated
- [ ] Socket.io event names are read from env with sane defaults
- [ ] Backend emits to frontend AFTER database save (not before)
- [ ] Device status payload includes `actionId` for reconciliation
- [ ] `useSensorSocket` cleanup function properly unsubscribes
- [ ] Error events emitted and handled on both sides
- [ ] Tested with backend and frontend both running
