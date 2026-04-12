---
description: "Use when implementing real-time features, setting up Socket.io listeners/emitters, or configuring MQTT device communication. Ensures proper event naming, message formatting, and connection lifecycle."
applyTo:
  [
    "iot-environment-monitoring-be/socket/**/*.js",
    "iot-environment-monitoring-be/mqtt/**/*.js",
    "iot-environment-monitoring-fe/src/hooks/useWebSocket.js",
  ]
---

# Real-Time Integration (Socket.io & MQTT)

## Data Flow Architecture

```
IoT Devices (MQTT)
    ↓
MQTT Broker (mqtt://localhost:1883)
    ↓
Backend MQTT Client (mqtt/mqttClient.js)
    ↓ Subscribe & Parse
Database Update (PostgreSQL)
    ↓ Socket.io Emit
Frontend WebSocket Listener (useWebSocket.js)
    ↓
React Component (setState triggers re-render)
```

## Backend: MQTT Client Setup

### Connection & Subscription Pattern

```javascript
// iot-environment-monitoring-be/mqtt/mqttClient.js
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://localhost:1883", {
  clientId: "iot-backend-" + Math.random().toString(16).slice(2),
  reconnectPeriod: 5000,
});

client.on("connect", () => {
  console.log("✓ MQTT connected");
  client.subscribe("sensors/+/data", (err) => {
    if (err) console.error(err);
  });
});

client.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    // payload: { sensorId, value, unit, timestamp }

    // Save to database
    await SensorData.create({
      sensorId: payload.sensorId,
      value: payload.value,
    });

    // Emit to frontend
    io.emit("sensor-data-received", {
      sensorId: payload.sensorId,
      value: payload.value,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("MQTT parse error:", error);
  }
});

client.on("error", (error) => {
  console.error("MQTT error:", error);
  // Reconnect handled by reconnectPeriod
});

module.exports = client;
```

### Rules

- **Topic naming**: Use forward slashes for hierarchy (`sensors/123/data`, `devices/456/status`)
- **Wildcard subscriptions**: `+` matches one level, `#` matches all remaining
- **Always wrap in try-catch**: MQTT messages may have invalid JSON
- **Parse and validate** before saving to database
- **Emit to Socket.io after database save** (frontend sees confirmed data)

## Backend: Socket.io Event Handlers

### Connection & Listener Pattern

```javascript
// iot-environment-monitoring-be/socket/socketHandler.js
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    // Listen for device control commands from frontend
    socket.on("control-device", async (payload) => {
      try {
        const { deviceId, action, value } = payload;

        // Validate & execute
        const device = await Device.findByPk(deviceId);
        if (!device) {
          socket.emit("control-error", { error: "Device not found" });
          return;
        }

        // Publish to MQTT (device listens and acts)
        mqttClient.publish(
          `devices/${deviceId}/control`,
          JSON.stringify({ action, value }),
          { retain: false },
        );

        // Broadcast control event to all clients
        io.emit("control-executed", {
          deviceId,
          action,
          value,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit("control-error", { error: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`✓ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;
```

### Event Naming Conventions

- **To frontend**: `sensor-data-received`, `control-executed`, `device-status-changed`
- **From frontend**: `control-device`, `subscribe-device`, `get-history`
- **Errors**: `control-error`, `connection-error`
- **Pattern**: Action-Object format (kebab-case): `verb-noun`

### Rules

- **Validate all incoming events** (check deviceId, action, etc.)
- **Emit errors back** to socket, not throw
- **Broadcast vs Send**: Use `io.emit()` to all clients, `socket.emit()` to one
- **Never trust client input**: Verify device ownership/permissions (even though auth is disabled)

## Frontend: Socket.io Listener Hook

### useWebSocket Pattern

```javascript
// iot-environment-monitoring-fe/src/hooks/useWebSocket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const useWebSocket = (eventName) => {
  const [eventData, setEventData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✓ WebSocket connected");
      setConnected(true);
    });

    socket.on(eventName, (data) => {
      console.log(`✓ Event received: ${eventName}`, data);
      setEventData(data);
    });

    socket.on("disconnect", () => {
      console.log("✗ WebSocket disconnected");
      setConnected(false);
    });

    return () => socket.disconnect();
  }, [eventName]);

  return { eventData, connected };
};
```

### Usage in Component

```javascript
import { useWebSocket } from "../hooks/useWebSocket";

export default function Dashboard() {
  const { eventData: newSensorData } = useWebSocket("sensor-data-received");

  useEffect(() => {
    if (newSensorData) {
      // Updated in real-time when MQTT data arrives
      setSensors((prev) =>
        prev.map((s) =>
          s.id === newSensorData.sensorId
            ? { ...s, latestValue: newSensorData.value }
            : s,
        ),
      );
    }
  }, [newSensorData]);

  return <Dashboard data={sensors} />;
}
```

### Rules

- **One event per hook**: Don't try to listen to multiple events
- **Cleanup on unmount**: Return unsubscribe function
- **Handle disconnection gracefully**: Show UI indicator when `connected === false`
- **Dependency array**: Only `[eventName]` (socket creates/destroys on change)

## Emitting Events from Frontend to Backend

```javascript
// In component, send control command
const handleDeviceControl = async (deviceId, action) => {
  const socket = io("http://localhost:5000");
  socket.emit("control-device", { deviceId, action, value: "on" });

  // Listen for response
  socket.on("control-executed", (data) => {
    console.log("Control successful:", data);
    showNotification("Device controlled successfully");
  });

  socket.on("control-error", (error) => {
    console.error("Control failed:", error);
    showError(error.error);
  });
};
```

### Rules

- **Emit after validation on frontend** (don't trust backend to validate everything)
- **Wait for response**: Always listen for success/error events
- **Timeout handling**: Implement timeout if backend doesn't respond
- **Log all events**: Help debugging real-time issues

## Message Format Standards

### Sensor Data Event (MQTT → Backend → Frontend)

```javascript
// MQTT payload from device
{
  sensorId: 1,
  value: 25.5,
  unit: "C",
  timestamp: "2024-04-13T10:30:00Z"
}

// Backend Socket.io emission
socket.emit('sensor-data-received', {
  sensorId: 1,
  value: 25.5,
  timestamp: new Date().toISOString()
});
```

### Control Event (Frontend → Backend → MQTT → Device)

```javascript
// Frontend emission
socket.emit("control-device", {
  deviceId: 5,
  action: "power",
  value: "on",
});

// Backend publishes to MQTT
mqttClient.publish(
  "devices/5/control",
  JSON.stringify({
    action: "power",
    value: "on",
    timestamp: Date.now(),
  }),
);
```

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
  const { connected } = useWebSocket("sensor-data-received");

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

- [ ] MQTT subscription uses proper topic hierarchy (`sensors/+/data`)
- [ ] All MQTT messages wrapped in try-catch and JSON validated
- [ ] Socket.io events follow verb-noun naming (kebab-case)
- [ ] Backend emits to frontend AFTER database save (not before)
- [ ] Frontend validates control commands before emitting to backend
- [ ] useWebSocket cleanup function properly unsubscribes
- [ ] Error events emitted and handled on both sides
- [ ] Tested with backend and frontend both running
