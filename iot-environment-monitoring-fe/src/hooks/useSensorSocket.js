import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const rawSocketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";
const SOCKET_URL = rawSocketUrl.replace(/\/api\/?$/, "");
const SENSOR_EVENT = import.meta.env.VITE_SOCKET_SENSOR_EVENT || "sensor-data";
const DEVICE_EVENT =
  import.meta.env.VITE_SOCKET_DEVICE_EVENT || "device-status";

let sharedSocket = null;
let subscriberCount = 0;

const getSharedSocket = () => {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return sharedSocket;
};

export const useSensorSocket = () => {
  const [connected, setConnected] = useState(false);
  const [lastSensorPacket, setLastSensorPacket] = useState(null);
  const [lastDevicePacket, setLastDevicePacket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = getSharedSocket();
    subscriberCount += 1;

    const handleConnect = () => {
      setConnected(true);
      setError(null);
    };

    const handleSensorEvent = (packet) => {
      setLastSensorPacket(packet);
    };

    const handleDeviceEvent = (packet) => {
      setLastDevicePacket(packet);
    };

    const handleConnectError = (socketError) => {
      setError(socketError.message || "Socket connection failed");
      setConnected(false);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on(SENSOR_EVENT, handleSensorEvent);
    socket.on(DEVICE_EVENT, handleDeviceEvent);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off(SENSOR_EVENT, handleSensorEvent);
      socket.off(DEVICE_EVENT, handleDeviceEvent);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);

      subscriberCount = Math.max(0, subscriberCount - 1);

      if (subscriberCount === 0) {
        socket.disconnect();
        sharedSocket = null;
      }
    };
  }, []);

  return {
    connected,
    lastSensorPacket,
    lastDevicePacket,
    error,
  };
};
