// Dùng để kết nối WebSocket và nhận dữ liệu cảm biến thời gian thực từ server
// Chia sẻ 1 kết nối socket duy nhất cho nhiều component
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
let subscriberCount = 0; // Đếm số component đang sử dụng hook để quản lý kết nối socket

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

    // 1. Tối ưu: Định nghĩa các handler ngắn gọn
    const onConnect = () => {
      setConnected(true);
      setError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onError = (socketError) => {
      setError(socketError.message || "Socket connection failed");
      setConnected(false);
    };

    // 2. Tối ưu: Truyền thẳng state setter vào socket.on
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    socket.on(SENSOR_EVENT, setLastSensorPacket);
    socket.on(DEVICE_EVENT, setLastDevicePacket);

    socket.connect();

    return () => {
      // 3. Cleanup tương ứng
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off(SENSOR_EVENT, setLastSensorPacket);
      socket.off(DEVICE_EVENT, setLastDevicePacket);

      subscriberCount = Math.max(0, subscriberCount - 1);

      if (subscriberCount === 0) {
        socket.disconnect();
        sharedSocket = null;
      }
    };
  }, []);

  return { connected, lastSensorPacket, lastDevicePacket, error };
};
