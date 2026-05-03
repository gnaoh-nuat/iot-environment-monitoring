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
const SENSOR_STALE_THRESHOLD = 10000;

const formatChartTime = (dateValue) => {
  if (!dateValue) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateValue));
};

// 1. Tối ưu: Dùng Object thay vì Map để build lịch sử chart ngắn gọn hơn
const buildChartDataFromHistories = (histories) => {
  const chartMap = {};
  histories.forEach(({ sensorName, rows }) => {
    rows.forEach((row) => {
      const timeKey =
        Math.round(new Date(row.createdAt || Date.now()).getTime() / 2000) *
        2000;
      if (!chartMap[timeKey])
        chartMap[timeKey] = {
          timestamp: timeKey,
          time: formatChartTime(new Date(timeKey)),
        };
      chartMap[timeKey][sensorName] = Number(row.value);
    });
  });

  return Object.values(chartMap)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ timestamp, ...rest }) => rest) // Bỏ timestamp ra khỏi object cuối
    .slice(-HISTORY_LIMIT);
};

const normalizeActionState = (status) => String(status || "").toUpperCase();

// 2. Tối ưu: Dùng Regex thay vì hàng loạt if/else includes
const resolveDeviceVisual = (name) => {
  const lower = String(name || "").toLowerCase();
  const icon = lower.match(/fan|quạt/)
    ? Fan
    : lower.match(/pump|bơm/)
      ? Droplet
      : Lightbulb;

  let color = "#F59E0B"; // Default yellow
  if (lower.match(/red|đỏ/)) color = "#EF4444";
  else if (lower.match(/green|xanh lá/) || icon === Fan) color = "#10B981";
  else if (lower.match(/blue|xanh dương/) || icon === Droplet)
    color = "#3B82F6";

  return { icon, color };
};

const resolveSensorVisual = (name) => {
  const lower = String(name || "").toLowerCase();
  if (lower.match(/temp|nhiệt/))
    return {
      icon: Thermometer,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      unit: "°C",
    };
  if (lower.match(/hum|ẩm/))
    return { icon: Droplets, color: "#3B82F6", bgColor: "#DBEAFE", unit: "%" };
  if (lower.match(/light|sáng|lux/))
    return { icon: Sun, color: "#F59E0B", bgColor: "#FEF3C7", unit: "Lux" };
  return { icon: Thermometer, color: "#9CA3AF", bgColor: "#F3F4F6", unit: "" };
};

const toDashboardDevice = (dbDevice, latestActionByDeviceId) => {
  const { icon, color } = resolveDeviceVisual(dbDevice.name);
  const latestAction = latestActionByDeviceId[String(dbDevice.id)];
  const status = latestAction
    ? normalizeActionState(latestAction.status)
    : "OFF";

  return {
    id: String(dbDevice.id),
    backendId: dbDevice.id,
    name: dbDevice.name,
    icon,
    color,
    enabled: status === "ON",
    pendingActionId: ["PENDING", "LOADING"].includes(status)
      ? Number(latestAction.id)
      : null,
    errorMessage: ["FAILED", "TIMEOUT"].includes(status)
      ? "Thiết bị không phản hồi"
      : null,
  };
};

const toDashboardSensor = ({ sensorName, rows }) => {
  const latestRow = rows[rows.length - 1];
  return {
    id: sensorName,
    name: sensorName,
    ...resolveSensorVisual(sensorName),
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

  const lastSensorUpdateTimeRef = useRef(Date.now());
  const errorTimeoutsRef = useRef({});

  const {
    connected: socketConnected,
    lastSensorPacket,
    lastDevicePacket,
    error: socketError,
  } = useSensorSocket();

  const setDeviceError = useCallback((deviceId, errorMessage) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, errorMessage } : d)),
    );
    if (errorTimeoutsRef.current[deviceId])
      clearTimeout(errorTimeoutsRef.current[deviceId]);

    if (errorMessage) {
      errorTimeoutsRef.current[deviceId] = setTimeout(() => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, errorMessage: null } : d,
          ),
        );
        delete errorTimeoutsRef.current[deviceId];
      }, 5000);
    }
  }, []);

  // Health check interval & Cleanup
  useEffect(() => {
    const healthInterval = setInterval(() => {
      setIsSensorOnline(
        Date.now() - lastSensorUpdateTimeRef.current <= SENSOR_STALE_THRESHOLD,
      );
    }, 2000);
    return () => {
      clearInterval(healthInterval);
      Object.values(errorTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Init Data
  useEffect(() => {
    let mounted = true;
    api
      .get("/dashboard/init", { params: { historyLimit: HISTORY_LIMIT } })
      .then((res) => {
        if (!mounted) return;
        const {
          devices = [],
          latestActionByDeviceId = {},
          sensorHistories = [],
        } = res.data || {};

        const loadedDevices = devices.map((d) =>
          toDashboardDevice(d, latestActionByDeviceId),
        );
        setDevices(loadedDevices);
        setLoadingStates(
          loadedDevices.reduce((acc, dev) => {
            if (dev.pendingActionId) acc[dev.id] = true;
            return acc;
          }, {}),
        );
        setSensors(sensorHistories.map(toDashboardSensor));
        setChartData(buildChartDataFromHistories(sensorHistories));
        setDashboardError(null);
      })
      .catch(
        (err) =>
          mounted &&
          setDashboardError(err.message || "Không thể tải dữ liệu khởi tạo."),
      );
    return () => {
      mounted = false;
    };
  }, []);

  // 3. Tối ưu: Bỏ lastSocketErrorRef thừa thãi
  useEffect(() => {
    if (socketError) setDashboardError(socketError);
    else if (socketConnected) setDashboardError(null);
  }, [socketConnected, socketError]);

  // Handle Socket Device Status
  useEffect(() => {
    if (
      !lastDevicePacket ||
      lastDevicePacket.stale ||
      lastDevicePacket.deviceId == null
    )
      return;

    const {
      deviceId,
      status,
      targetState,
      error: controlError,
    } = lastDevicePacket;
    const normalizedDeviceId = String(deviceId);
    const normalizedStatus = normalizeActionState(status);
    const resolvedEnabled = targetState
      ? normalizeActionState(targetState) === "ON"
      : normalizedStatus === "ON";

    setDevices((prev) =>
      prev.map((d) =>
        d.id === normalizedDeviceId
          ? { ...d, enabled: resolvedEnabled, pendingActionId: null }
          : d,
      ),
    );

    if (normalizedStatus !== "ON" && normalizedStatus !== "OFF") {
      setDeviceError(
        normalizedDeviceId,
        controlError || "Thiết bị không phản hồi",
      );
    }
    setLoadingStates((prev) => ({ ...prev, [normalizedDeviceId]: false }));
  }, [lastDevicePacket, setDeviceError]);

  // Handle Socket Sensor Data
  useEffect(() => {
    const readings = lastSensorPacket?.readings;
    if (!readings?.length) return;

    lastSensorUpdateTimeRef.current = Date.now();
    setIsSensorOnline(true);

    const timeKey =
      Math.round(
        new Date(lastSensorPacket.timestamp || Date.now()).getTime() / 2000,
      ) * 2000;
    const formattedTime = formatChartTime(new Date(timeKey));
    const nextPoint = { time: formattedTime };

    // 4. Tối ưu: Cập nhật sensors bằng mảng thông thường thay vì ép kiểu Map
    setSensors((prev) => {
      const updated = [...prev];
      readings.forEach((r) => {
        if (!r?.name) return;
        const val = Number(r.value);
        const finalVal = Number.isFinite(val) ? val : null;
        nextPoint[r.name] = finalVal;

        const idx = updated.findIndex((s) => s.id === String(r.name));
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], value: finalVal };
        } else {
          updated.push({
            id: String(r.name),
            name: String(r.name),
            ...resolveSensorVisual(r.name),
            value: finalVal,
          });
        }
      });
      return updated;
    });

    setChartData((prev) => {
      const lastIdx = prev.findIndex((p) => p.time === formattedTime);
      if (lastIdx >= 0) {
        const nextData = [...prev];
        nextData[lastIdx] = { ...nextData[lastIdx], ...nextPoint };
        return nextData;
      }
      return [...prev, nextPoint].slice(-HISTORY_LIMIT);
    });
  }, [lastSensorPacket]);

  const handleDeviceToggle = useCallback(
    async (deviceId) => {
      let targetDevice = null;
      setDevices((prev) => {
        targetDevice = prev.find((d) => d.id === deviceId) || null;
        return targetDevice
          ? prev.map((d) =>
              d.id === deviceId ? { ...d, errorMessage: null } : d,
            )
          : prev;
      });

      if (!targetDevice) return;

      setLoadingStates((prev) => ({ ...prev, [deviceId]: true }));
      const action = targetDevice.enabled ? "OFF" : "ON";

      try {
        const { data } = await api.post("/devices/control", {
          deviceId: targetDevice.backendId,
          action,
        });
        const actionId = Number(data?.actionId);
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  pendingActionId: Number.isFinite(actionId) ? actionId : null,
                }
              : d,
          ),
        );
      } catch (deviceError) {
        setLoadingStates((prev) => ({ ...prev, [deviceId]: false }));
        setDeviceError(deviceId, deviceError.message || "Không thể gửi lệnh");
      }
    },
    [setDeviceError],
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
