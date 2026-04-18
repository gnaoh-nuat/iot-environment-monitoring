import { useEffect, useRef, useState } from "react";
import {
  Thermometer,
  Droplets,
  Sun,
  Fan,
  Lightbulb,
  Droplet,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import { useSensorSocket } from "../hooks/useSensorSocket";

const SENSOR_DEFINITIONS = [
  {
    id: "temperature",
    name: "Nhiệt độ",
    unit: "°C",
    icon: Thermometer,
    color: "#EF4444",
    bgColor: "#FEE2E2",
  },
  {
    id: "humidity",
    name: "Độ ẩm",
    unit: "%",
    icon: Droplets,
    color: "#3B82F6",
    bgColor: "#DBEAFE",
  },
  {
    id: "light",
    name: "Ánh sáng",
    unit: "Lux",
    icon: Sun,
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
];

const DEVICE_DEFINITIONS = [
  {
    id: "fan",
    name: "Quạt thông gió",
    icon: Fan,
    color: "#10B981",
    enabled: false,
    matchKeywords: ["fan", "quat"],
  },
  {
    id: "light",
    name: "Đèn LED",
    icon: Lightbulb,
    color: "#F59E0B",
    enabled: false,
    matchKeywords: ["light", "den", "led"],
  },
  {
    id: "pump",
    name: "Máy bơm nước",
    icon: Droplet,
    color: "#3B82F6",
    enabled: false,
    matchKeywords: ["pump", "bom"],
  },
];

const HISTORY_SENSOR_NAMES = SENSOR_DEFINITIONS.map((sensor) => sensor.id);

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

const buildChartDataFromHistories = (histories) => {
  const chartMap = new Map();

  histories.forEach(({ sensorName, rows }) => {
    rows.forEach((row) => {
      const rowDate = row.createdAt ? new Date(row.createdAt) : new Date();

      // FIX: Làm tròn thời gian chính xác tới bội số của 2 giây (chẵn 2s)
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
    .slice(-15);
};

const normalizeDeviceName = (name) =>
  String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeActionState = (status) => String(status || "").toUpperCase();

export default function Dashboard() {
  const [sensors, setSensors] = useState(
    SENSOR_DEFINITIONS.map((sensor) => ({
      ...sensor,
      value: null,
    })),
  );
  const [devices, setDevices] = useState(
    DEVICE_DEFINITIONS.map((device) => ({
      ...device,
      backendId: null,
      pendingActionId: null,
      errorMessage: null,
    })),
  );
  const [loadingStates, setLoadingStates] = useState({});
  const [chartData, setChartData] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);
  const pendingTimeoutsRef = useRef({});
  const devicesRef = useRef([]);
  const [isSensorOnline, setIsSensorOnline] = useState(false);
  const lastSensorUpdateTimeRef = useRef(Date.now());

  const {
    lastSensorPacket,
    lastDevicePacket,
    error: socketError,
  } = useSensorSocket();

  useEffect(() => {
    return () => {
      Object.values(pendingTimeoutsRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
      pendingTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastSensorUpdateTimeRef.current > 10000) {
        setIsSensorOnline(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDashboardSnapshot = async () => {
      try {
        // Gọi API lấy snapshot ban đầu
        const response = await api.get("/dashboard/init", {
          params: { historyLimit: 15 },
        });

        // VÌ api.js trả về response.data, nên 'response' ở đây chính là
        // object { success: true, data: { devices, sensorHistories... } }
        const snapshotData = response.data || {}; // Đây là phần chứa dữ liệu thực sự

        const backendDevices = Array.isArray(snapshotData.devices)
          ? snapshotData.devices
          : [];
        const latestActionByDeviceId =
          snapshotData.latestActionByDeviceId || {};
        const sensorHistories = Array.isArray(snapshotData.sensorHistories)
          ? snapshotData.sensorHistories
          : [];

        const loadingMap = {};

        // 1. Cập nhật Mapping Device ID
        setDevices((prevDevices) => {
          const assignedBackendIds = new Set();

          const devicesWithBackendIds = prevDevices.map((device, index) => {
            const matchedByKeyword = backendDevices.find((backendDevice) => {
              const backendId = String(backendDevice.id);
              if (assignedBackendIds.has(backendId)) return false;

              const normalizedBackendName = normalizeDeviceName(
                backendDevice.name,
              );
              return device.matchKeywords.some((keyword) =>
                normalizedBackendName.includes(keyword),
              );
            });

            const fallbackBackendDevice =
              backendDevices.find((backendDevice) => {
                return !assignedBackendIds.has(String(backendDevice.id));
              }) || backendDevices[index];

            const matchedDevice = matchedByKeyword || fallbackBackendDevice;

            if (matchedDevice?.id !== undefined && matchedDevice?.id !== null) {
              assignedBackendIds.add(String(matchedDevice.id));
            }

            return {
              ...device,
              backendId: matchedDevice?.id ?? device.backendId,
            };
          });

          // 2. Cập nhật trạng thái ON/OFF/PENDING từ snapshot
          return devicesWithBackendIds.map((device) => {
            if (!device.backendId) return device;

            const latestAction =
              latestActionByDeviceId[String(device.backendId)];
            if (!latestAction) return device;

            const normalizedStatus = normalizeActionState(latestAction.status);
            const isPending = ["PENDING", "LOADING"].includes(normalizedStatus);
            const isSuccessful = normalizedStatus === "ON";
            const isFailed = ["FAILED", "TIMEOUT"].includes(normalizedStatus);

            if (isPending) {
              loadingMap[device.id] = true;
            }

            return {
              ...device,
              enabled: isSuccessful,
              pendingActionId: isPending ? Number(latestAction.id) : null,
              errorMessage: isFailed
                ? "Lỗi kết nối hoặc thiết bị không phản hồi"
                : null,
            };
          });
        });

        setLoadingStates(loadingMap);

        // 3. Cập nhật các chỉ số cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng)
        const latestValues = {};
        sensorHistories.forEach(({ sensorName, rows }) => {
          const latestRow = rows[rows.length - 1];
          if (latestRow) {
            latestValues[sensorName] = Number(latestRow.value);
          }
        });

        setSensors((prevSensors) =>
          prevSensors.map((sensor) => ({
            ...sensor,
            value:
              latestValues[sensor.id] !== undefined
                ? latestValues[sensor.id]
                : sensor.value,
          })),
        );

        // 4. Cập nhật dữ liệu biểu đồ từ lịch sử
        setChartData(buildChartDataFromHistories(sensorHistories));
      } catch (loadError) {
        console.error("Lỗi khi tải dữ liệu Dashboard:", loadError);
        setDashboardError(
          "Không thể tải dữ liệu khởi tạo. Vui lòng kiểm tra Server.",
        );
      }
    };

    loadDashboardSnapshot();
  }, []);

  useEffect(() => {
    if (!lastDevicePacket || lastDevicePacket.stale) {
      return;
    }

    const {
      actionId,
      deviceId,
      status,
      targetState,
      error: controlError,
    } = lastDevicePacket;

    const normalizedDeviceId = String(deviceId);
    const normalizedIncomingStatus = normalizeActionState(status);

    if (!actionId || !deviceId || !status) {
      return;
    }

    const isSuccess = status === "ON" || status === "OFF";

    console.log(
      `[Socket Received] Device: ${deviceId}, Status: ${normalizedIncomingStatus}, Target: ${targetState}`,
    );

    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        String(device.backendId) === normalizedDeviceId
          ? {
              ...device,
              enabled: targetState === "ON",
              pendingActionId: null,
              errorMessage: isSuccess
                ? null
                : controlError ||
                  "Thiết bị không phản hồi hoặc thực thi thất bại",
            }
          : device,
      ),
    );

    const matchedUiDeviceIds = devicesRef.current
      .filter((device) => String(device.backendId) === normalizedDeviceId)
      .map((device) => device.id);

    if (matchedUiDeviceIds.length === 0) {
      return;
    }

    setLoadingStates((prevLoading) => {
      const nextLoading = { ...prevLoading };

      matchedUiDeviceIds.forEach((uiDeviceId) => {
        nextLoading[uiDeviceId] = false;

        const timeoutId = pendingTimeoutsRef.current[uiDeviceId];
        if (timeoutId) {
          clearTimeout(timeoutId);
          delete pendingTimeoutsRef.current[uiDeviceId];
        }
      });

      return nextLoading;
    });
  }, [lastDevicePacket]);

  useEffect(() => {
    const readings = lastSensorPacket?.readings;
    if (!Array.isArray(readings) || readings.length === 0) {
      return;
    }

    lastSensorUpdateTimeRef.current = Date.now();
    setIsSensorOnline(true);

    const packetDate = new Date(lastSensorPacket.timestamp || Date.now());

    // LÀM TRÒN: Ép thời gian của Socket về mốc chẵn 2 giây
    const timeKey = Math.round(packetDate.getTime() / 2000) * 2000;
    const formattedTime = formatChartTime(new Date(timeKey));

    setChartData((prevChartData) => {
      const newData = [...prevChartData];

      // Kiểm tra xem mốc thời gian này đã có điểm trên biểu đồ chưa
      const existingIndex = newData.findIndex((p) => p.time === formattedTime);

      const nextPoint = { time: formattedTime };
      readings.forEach((reading) => {
        nextPoint[reading.name] = Number(reading.value);
      });

      if (existingIndex >= 0) {
        // Đã có -> Cập nhật đè lên cột hiện tại, không tạo thêm điểm ở giữa
        newData[existingIndex] = { ...newData[existingIndex], ...nextPoint };
      } else {
        // Chưa có -> Tạo cột mới
        newData.push(nextPoint);
      }

      return newData.slice(-15);
    });
  }, [lastSensorPacket]);

  const handleDeviceToggle = async (deviceId) => {
    const selectedDevice = devices.find((device) => device.id === deviceId);
    if (!selectedDevice) {
      return;
    }

    if (!selectedDevice.backendId) {
      setDashboardError(
        "Khong tim thay backend deviceId. Vui long kiem tra bang Device.",
      );
      return;
    }

    const action = selectedDevice.enabled ? "OFF" : "ON";

    const existingTimerId = pendingTimeoutsRef.current[deviceId];
    if (existingTimerId) {
      clearTimeout(existingTimerId);
      delete pendingTimeoutsRef.current[deviceId];
    }

    setDashboardError(null);
    setLoadingStates((prev) => ({ ...prev, [deviceId]: true }));
    // Clear previous error message for this device
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, errorMessage: null } : device,
      ),
    );

    try {
      const response = await api.post("/device/control", {
        deviceId: selectedDevice.backendId,
        action,
      });

      const actionId = response?.data?.actionId;
      if (!actionId) {
        throw new Error("Control API did not return actionId");
      }

      // ✅ Ensure actionId is stored as number for consistent comparison
      const normalizedActionId = Number(actionId);

      console.log(
        `[handleDeviceToggle] Device: ${deviceId}, Action: ${action}, ActionId: ${normalizedActionId}`,
      );

      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId
            ? {
                ...device,
                pendingActionId: normalizedActionId,
                errorMessage: null,
              }
            : device,
        ),
      );

      pendingTimeoutsRef.current[deviceId] = setTimeout(() => {
        setLoadingStates((prev) => ({ ...prev, [deviceId]: false }));
        setDevices((prev) =>
          prev.map((device) => {
            if (device.id !== deviceId) {
              return device;
            }

            if (Number(device.pendingActionId) !== normalizedActionId) {
              return device;
            }

            return {
              ...device,
              pendingActionId: null,
              errorMessage:
                "Không nhận được phản hồi từ thiết bị. Vui lòng thử lại.",
            };
          }),
        );
        delete pendingTimeoutsRef.current[deviceId];
      }, 12000);
    } catch (controlError) {
      const timerId = pendingTimeoutsRef.current[deviceId];
      if (timerId) {
        clearTimeout(timerId);
        delete pendingTimeoutsRef.current[deviceId];
      }

      setLoadingStates((prev) => ({ ...prev, [deviceId]: false }));
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId
            ? {
                ...device,
                pendingActionId: null,
                errorMessage:
                  controlError.message || "Khong gui duoc lenh dieu khien",
              }
            : device,
        ),
      );
    }
  };

  const renderChart = (dataKey, stroke, name, domain) => {
    if (chartData.length === 0) {
      return (
        <div className="h-full min-h-[220px] flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          Chưa có dữ liệu lịch sử hoặc realtime cho {name.toLowerCase()}.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            vertical={true}
          />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dy={10}
            interval={0}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: "11px", fontWeight: 500 }}
            domain={domain}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #F3F4F6",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 500,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={3}
            name={name}
            connectNulls={true}
            dot={{
              fill: stroke,
              r: 4,
              strokeWidth: 2,
              stroke: "#fff",
            }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderTemperatureHumidityChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-full min-h-[220px] flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          Chưa có dữ liệu lịch sử hoặc realtime cho nhiệt độ/độ ẩm.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            vertical={true}
          />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dy={10}
            interval={0}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: "11px", fontWeight: 500 }}
            domain={[0, "dataMax + 10"]}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #F3F4F6",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 500,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#EF4444"
            strokeWidth={3}
            name="Nhiệt độ (°C)"
            connectNulls={true}
            dot={{
              fill: "#EF4444",
              r: 4,
              strokeWidth: 2,
              stroke: "#fff",
            }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#3B82F6"
            strokeWidth={3}
            name="Độ ẩm (%)"
            connectNulls={true}
            dot={{
              fill: "#3B82F6",
              r: 4,
              strokeWidth: 2,
              stroke: "#fff",
            }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-full min-h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      <aside className="w-1/4 flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
        <div className="flex flex-col gap-3 flex-shrink-0">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Cảm biến
          </h3>
          <div className="flex flex-col gap-3">
            {sensors.map((sensor) => {
              const Icon = sensor.icon;

              return (
                <div
                  key={sensor.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: sensor.bgColor }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: sensor.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-500 mb-0.5">
                        {sensor.name}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-800">
                          {sensor.value ?? "--"}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          {sensor.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shadow-sm transition-colors duration-500 ${
                          isSensorOnline
                            ? "bg-green-500 animate-pulse shadow-green-200"
                            : "bg-gray-300 shadow-gray-200"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-shrink-0">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Điều khiển thiết bị
          </h3>
          <div className="flex flex-col gap-3">
            {devices.map((device) => {
              const Icon = device.icon;
              const isLoading = loadingStates[device.id];

              return (
                <button
                  key={device.id}
                  onClick={() => handleDeviceToggle(device.id)}
                  disabled={isLoading}
                  className={`bg-white rounded-xl border p-4 transition-all duration-300 text-left shadow-sm ${device.enabled ? "border-green-400 bg-green-50/30" : "border-gray-100 hover:border-gray-300"} ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${device.enabled ? "border-green-200 bg-white shadow-sm" : "border-gray-100 bg-gray-50"}`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${
                            device.id === "fan" && device.enabled
                              ? "animate-spin-slow"
                              : ""
                          } ${
                            device.id === "light" && device.enabled
                              ? "animate-pulse-glow"
                              : ""
                          } ${
                            device.id === "pump" && device.enabled
                              ? "animate-bounce-slow"
                              : ""
                          }`}
                          style={{
                            color: device.enabled ? device.color : "#9ca3af",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">
                        {device.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {device.errorMessage
                          ? device.errorMessage
                          : device.enabled
                            ? "Đang hoạt động"
                            : "Nhấn để bật"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-6 rounded-full border-2 flex items-center transition-all px-0.5 ${device.enabled ? "bg-green-500 border-green-500" : "bg-gray-200 border-gray-200"}`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${device.enabled ? "translate-x-6" : "translate-x-0"}`}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
        {socketError || dashboardError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {socketError || dashboardError}
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-red-500" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Nhiệt độ & Độ ẩm
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi thời gian thực
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-1.5 rounded-full bg-red-50 border border-red-100">
                <span className="text-sm font-bold text-red-600">
                  {sensors[0].value ?? "--"}°C
                </span>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                <span className="text-sm font-bold text-blue-600">
                  {sensors[1].value ?? "--"}%
                </span>
              </div>
            </div>
          </div>
          <div className="h-[320px] min-h-[320px] w-full min-w-0">
            {renderTemperatureHumidityChart()}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Cường độ ánh sáng
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi thời gian thực
                </p>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100">
              <span className="text-sm font-bold text-amber-600">
                {sensors[2].value ?? "--"} Lux
              </span>
            </div>
          </div>
          <div className="h-[320px] min-h-[320px] w-full min-w-0">
            {renderChart("light", "#F59E0B", "Ánh sáng (Lux)", [
              0,
              "dataMax + 20",
            ])}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px currentColor); }
          50% { opacity: 0.6; filter: drop-shadow(0 0 6px currentColor); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
