// Hook này quản lý dữ liệu cảm biến và thiết bị cho dashboard
// Bao gồm cả việc xử lý dữ liệu từ API và socket
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Thermometer,
  Droplets,
  Sun,
  Fan,
  Lightbulb,
  Droplet,
} from "lucide-react";
import api from "../services/api";
import { useSensorSocket } from "./useSensorSocket";

const HISTORY_LIMIT = 15;
const SENSOR_STALE_THRESHOLD = 10000; // 10 giây không có cập nhật sẽ coi như cảm biến offline

// Định dạng thời gian cho biểu đồ (chỉ hiển thị giờ:phút:giây)
const formatChartTime = (dateValue) => {
  if (!dateValue) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateValue));
};

// Hàm này sẽ chuyển đổi dữ liệu lịch sử cảm biến từ backend thành định dạng phù hợp cho biểu đồ
const buildChartDataFromHistories = (histories) => {
  const chartMap = new Map();

  histories.forEach(({ sensorName, rows }) => {
    rows.forEach((row) => {
      const rowDate = row.createdAt ? new Date(row.createdAt) : new Date();
      const timeKey = Math.round(rowDate.getTime() / 2000) * 2000;

      if (!chartMap.has(timeKey)) {
        chartMap.set(timeKey, {
          timestamp: timeKey,
          time: formatChartTime(new Date(timeKey)),
        });
      }

      chartMap.get(timeKey)[sensorName] = Number(row.value);
    });
  });

  return Array.from(chartMap.values())
    .sort((first, second) => first.timestamp - second.timestamp)
    .map((entry) => {
      const nextEntry = { ...entry };
      delete nextEntry.timestamp;
      return nextEntry;
    })
    .slice(-HISTORY_LIMIT);
};

const normalizeActionState = (status) => String(status || "").toUpperCase();

const resolveDeviceVisual = (deviceName) => {
  const nameLower = String(deviceName || "").toLowerCase();

  let icon = Lightbulb;
  let color = "#6B7280";

  if (nameLower.includes("fan") || nameLower.includes("quạt")) {
    icon = Fan;
  } else if (nameLower.includes("pump") || nameLower.includes("bơm")) {
    icon = Droplet;
  }

  if (nameLower.includes("red") || nameLower.includes("đỏ")) {
    color = "#EF4444";
  } else if (nameLower.includes("green") || nameLower.includes("xanh lá")) {
    color = "#10B981";
  } else if (nameLower.includes("yellow") || nameLower.includes("vàng")) {
    color = "#F59E0B";
  } else if (nameLower.includes("blue") || nameLower.includes("xanh dương")) {
    color = "#3B82F6";
  } else if (icon === Fan) {
    color = "#10B981";
  } else if (icon === Droplet) {
    color = "#3B82F6";
  } else {
    color = "#F59E0B";
  }

  return { icon, color };
};

const resolveSensorVisual = (sensorName) => {
  const nameLower = String(sensorName || "").toLowerCase();

  if (nameLower.includes("temp") || nameLower.includes("nhiệt")) {
    return {
      icon: Thermometer,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      unit: "°C",
    };
  }

  if (nameLower.includes("hum") || nameLower.includes("ẩm")) {
    return {
      icon: Droplets,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      unit: "%",
    };
  }

  if (
    nameLower.includes("light") ||
    nameLower.includes("sáng") ||
    nameLower.includes("lux")
  ) {
    return {
      icon: Sun,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      unit: "Lux",
    };
  }

  return {
    icon: Thermometer,
    color: "#9CA3AF",
    bgColor: "#F3F4F6",
    unit: "",
  };
};

const toDashboardDevice = (dbDevice, latestActionByDeviceId) => {
  const { icon, color } = resolveDeviceVisual(dbDevice.name);
  const latestAction = latestActionByDeviceId[String(dbDevice.id)];
  const normalizedStatus = latestAction
    ? normalizeActionState(latestAction.status)
    : "OFF";

  return {
    id: String(dbDevice.id),
    backendId: dbDevice.id,
    name: dbDevice.name,
    icon,
    color,
    enabled: normalizedStatus === "ON",
    pendingActionId: ["PENDING", "LOADING"].includes(normalizedStatus)
      ? Number(latestAction.id)
      : null,
    errorMessage: ["FAILED", "TIMEOUT"].includes(normalizedStatus)
      ? "Thiết bị không phản hồi"
      : null,
  };
};

const toDashboardSensor = ({ sensorName, rows }) => {
  const { icon, color, bgColor, unit } = resolveSensorVisual(sensorName);
  const latestRow = rows[rows.length - 1];

  return {
    id: sensorName,
    name: sensorName,
    icon,
    color,
    bgColor,
    unit,
    value: latestRow ? Number(latestRow.value) : null,
  };
};

export const useDashboardData = () => {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [chartData, setChartData] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);
  const [isSensorOnline, setIsSensorOnline] = useState(false);

  const lastSensorUpdateTimeRef = useRef(0);
  const lastSocketErrorRef = useRef(null);

  // 🆕 Thêm ref để lưu trữ các bộ đếm thời gian (timer) của thông báo lỗi thiết bị
  const errorTimeoutsRef = useRef({});

  const {
    connected: socketConnected,
    lastSensorPacket,
    lastDevicePacket,
    error: socketError,
  } = useSensorSocket();

  useEffect(() => {
    lastSensorUpdateTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        Date.now() - lastSensorUpdateTimeRef.current >
        SENSOR_STALE_THRESHOLD
      ) {
        setIsSensorOnline(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 🆕 Dọn dẹp tất cả các timer khi Component bị hủy (tránh memory leak)
  useEffect(() => {
    return () => {
      Object.values(errorTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // 🆕 Xử lý tự động ẩn lỗi sau 5 giây
  useEffect(() => {
    devices.forEach((device) => {
      if (device.errorMessage) {
        // Nếu thiết bị có lỗi mà chưa có timer đếm ngược, ta khởi tạo timer 5s
        if (!errorTimeoutsRef.current[device.id]) {
          errorTimeoutsRef.current[device.id] = setTimeout(() => {
            // Hết 5s -> Xóa câu thông báo lỗi đi
            setDevices((prev) =>
              prev.map((d) =>
                d.id === device.id ? { ...d, errorMessage: null } : d,
              ),
            );
            // Hủy theo dõi timer này
            delete errorTimeoutsRef.current[device.id];
          }, 5000); // 5000ms = 5 giây
        }
      } else {
        // Nếu thiết bị không có lỗi (ví dụ user vừa ấn bật lại), hủy timer cũ ngay lập tức
        if (errorTimeoutsRef.current[device.id]) {
          clearTimeout(errorTimeoutsRef.current[device.id]);
          delete errorTimeoutsRef.current[device.id];
        }
      }
    });
  }, [devices]);

  useEffect(() => {
    let mounted = true;

    const loadDashboardSnapshot = async () => {
      try {
        const response = await api.get("/dashboard/init", {
          params: { historyLimit: HISTORY_LIMIT },
        });

        if (!mounted) {
          return;
        }

        const snapshotData = response.data || {};
        const backendDevices = Array.isArray(snapshotData.devices)
          ? snapshotData.devices
          : [];
        const latestActionByDeviceId =
          snapshotData.latestActionByDeviceId || {};
        const sensorHistories = Array.isArray(snapshotData.sensorHistories)
          ? snapshotData.sensorHistories
          : [];

        const loadedDevices = backendDevices.map((dbDevice) =>
          toDashboardDevice(dbDevice, latestActionByDeviceId),
        );

        const loadingMap = {};
        loadedDevices.forEach((device) => {
          if (device.pendingActionId) {
            loadingMap[device.id] = true;
          }
        });

        setDevices(loadedDevices);
        setLoadingStates(loadingMap);

        const loadedSensors = sensorHistories.map(toDashboardSensor);
        setSensors(loadedSensors);
        setChartData(buildChartDataFromHistories(sensorHistories));
        setDashboardError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setDashboardError(
          loadError.message || "Không thể tải dữ liệu khởi tạo.",
        );
      }
    };

    loadDashboardSnapshot();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (socketError) {
      lastSocketErrorRef.current = socketError;
      setDashboardError(socketError);
      return;
    }

    if (socketConnected && lastSocketErrorRef.current) {
      setDashboardError((prev) =>
        prev === lastSocketErrorRef.current ? null : prev,
      );
      lastSocketErrorRef.current = null;
    }
  }, [socketConnected, socketError]);

  useEffect(() => {
    if (!lastDevicePacket || lastDevicePacket.stale) {
      return;
    }

    const {
      deviceId,
      status,
      targetState,
      error: controlError,
    } = lastDevicePacket;

    if (deviceId === undefined || deviceId === null) {
      return;
    }

    const normalizedDeviceId = String(deviceId);
    const normalizedStatus = normalizeActionState(status);
    const resolvedEnabled = targetState
      ? normalizeActionState(targetState) === "ON"
      : normalizedStatus === "ON";

    setDevices((prev) =>
      prev.map((device) =>
        device.id === normalizedDeviceId
          ? {
              ...device,
              enabled: resolvedEnabled,
              pendingActionId: null,
              errorMessage:
                normalizedStatus === "ON" || normalizedStatus === "OFF"
                  ? null
                  : controlError || "Thiết bị không phản hồi",
            }
          : device,
      ),
    );

    setLoadingStates((prev) => ({
      ...prev,
      [normalizedDeviceId]: false,
    }));
  }, [lastDevicePacket]);

  useEffect(() => {
    const readings = lastSensorPacket?.readings;

    if (!Array.isArray(readings) || readings.length === 0) {
      return;
    }

    lastSensorUpdateTimeRef.current = Date.now();
    setIsSensorOnline(true);

    setSensors((prev) => {
      const mergedBySensorId = new Map(
        prev.map((sensor) => [String(sensor.id), sensor]),
      );

      readings.forEach((reading) => {
        const sensorId = String(reading?.name || "");
        if (!sensorId) {
          return;
        }

        const numericValue = Number(reading.value);
        const nextValue = Number.isFinite(numericValue) ? numericValue : null;

        if (mergedBySensorId.has(sensorId)) {
          mergedBySensorId.set(sensorId, {
            ...mergedBySensorId.get(sensorId),
            value: nextValue,
          });
          return;
        }

        const { icon, color, bgColor, unit } = resolveSensorVisual(sensorId);
        mergedBySensorId.set(sensorId, {
          id: sensorId,
          name: sensorId,
          icon,
          color,
          bgColor,
          unit,
          value: nextValue,
        });
      });

      return Array.from(mergedBySensorId.values());
    });

    const packetDate = new Date(lastSensorPacket.timestamp || Date.now());
    const timeKey = Math.round(packetDate.getTime() / 2000) * 2000;
    const formattedTime = formatChartTime(new Date(timeKey));

    setChartData((prev) => {
      const nextPoint = { time: formattedTime };
      readings.forEach((reading) => {
        nextPoint[reading.name] = Number(reading.value);
      });

      const existedIndex = prev.findIndex(
        (point) => point.time === formattedTime,
      );

      if (existedIndex >= 0) {
        const nextData = [...prev];
        nextData[existedIndex] = {
          ...nextData[existedIndex],
          ...nextPoint,
        };
        return nextData.slice(-HISTORY_LIMIT);
      }

      return [...prev, nextPoint].slice(-HISTORY_LIMIT);
    });
  }, [lastSensorPacket]);

  const handleDeviceToggle = useCallback(
    async (deviceId) => {
      const selected = devices.find((device) => device.id === deviceId);

      if (!selected) {
        return;
      }

      const action = selected.enabled ? "OFF" : "ON";

      setLoadingStates((prev) => ({
        ...prev,
        [deviceId]: true,
      }));

      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId ? { ...device, errorMessage: null } : device,
        ),
      );

      try {
        const response = await api.post("/device/control", {
          deviceId: selected.backendId,
          action,
        });

        const actionId = Number(response?.data?.actionId);

        setDevices((prev) =>
          prev.map((device) =>
            device.id === deviceId
              ? {
                  ...device,
                  pendingActionId: Number.isFinite(actionId) ? actionId : null,
                }
              : device,
          ),
        );
      } catch (deviceError) {
        setLoadingStates((prev) => ({
          ...prev,
          [deviceId]: false,
        }));

        setDevices((prev) =>
          prev.map((device) =>
            device.id === deviceId
              ? {
                  ...device,
                  errorMessage:
                    deviceError.message || "Không thể gửi lệnh đến thiết bị",
                }
              : device,
          ),
        );
      }
    },
    [devices],
  );

  return {
    sensors,
    devices,
    loadingStates,
    chartData,
    dashboardError,
    isSensorOnline,
    handleDeviceToggle,
  };
};
