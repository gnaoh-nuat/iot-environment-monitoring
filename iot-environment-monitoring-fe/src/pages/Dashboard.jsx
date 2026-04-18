import { useEffect, useRef, useState } from "react";
import {
  Thermometer,
  Droplets,
  Sun,
  Fan,
  Lightbulb,
  Droplet,
  Loader2,
  Activity,
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

const formatChartTime = (dateValue) => {
  if (!dateValue) return "--:--";
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

const normalizeActionState = (status) => String(status || "").toUpperCase();

export default function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
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
      Object.values(pendingTimeoutsRef.current).forEach((timerId) =>
        clearTimeout(timerId),
      );
      pendingTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastSensorUpdateTimeRef.current > 10000)
        setIsSensorOnline(false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDashboardSnapshot = async () => {
      try {
        const response = await api.get("/dashboard/init", {
          params: { historyLimit: 15 },
        });
        const snapshotData = response.data || {};
        const backendDevices = Array.isArray(snapshotData.devices)
          ? snapshotData.devices
          : [];
        const latestActionByDeviceId =
          snapshotData.latestActionByDeviceId || {};
        const sensorHistories = Array.isArray(snapshotData.sensorHistories)
          ? snapshotData.sensorHistories
          : [];

        const loadedDevices = backendDevices.map((dbDevice) => {
          const nameLower = dbDevice.name.toLowerCase();
          let icon = Lightbulb,
            color = "#6B7280";
          if (nameLower.includes("fan") || nameLower.includes("quạt"))
            icon = Fan;
          else if (nameLower.includes("pump") || nameLower.includes("bơm"))
            icon = Droplet;

          if (nameLower.includes("red") || nameLower.includes("đỏ"))
            color = "#EF4444";
          else if (nameLower.includes("green") || nameLower.includes("xanh lá"))
            color = "#10B981";
          else if (nameLower.includes("yellow") || nameLower.includes("vàng"))
            color = "#F59E0B";
          else if (
            nameLower.includes("blue") ||
            nameLower.includes("xanh dương")
          )
            color = "#3B82F6";
          else {
            if (icon === Fan) color = "#10B981";
            else if (icon === Droplet) color = "#3B82F6";
            else if (icon === Lightbulb) color = "#F59E0B";
          }

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
        });

        const loadingMap = {};
        loadedDevices.forEach((d) => {
          if (d.pendingActionId) loadingMap[d.id] = true;
        });
        setDevices(loadedDevices);
        setLoadingStates(loadingMap);

        const loadedSensors = sensorHistories.map(({ sensorName, rows }) => {
          const nameLower = sensorName.toLowerCase();
          let icon = Thermometer,
            color = "#9CA3AF",
            bgColor = "#F3F4F6",
            unit = "";
          if (nameLower.includes("temp") || nameLower.includes("nhiệt")) {
            icon = Thermometer;
            color = "#EF4444";
            bgColor = "#FEE2E2";
            unit = "°C";
          } else if (nameLower.includes("hum") || nameLower.includes("ẩm")) {
            icon = Droplets;
            color = "#3B82F6";
            bgColor = "#DBEAFE";
            unit = "%";
          } else if (
            nameLower.includes("light") ||
            nameLower.includes("sáng") ||
            nameLower.includes("lux")
          ) {
            icon = Sun;
            color = "#F59E0B";
            bgColor = "#FEF3C7";
            unit = "Lux";
          }
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
        });
        setSensors(loadedSensors);
        setChartData(buildChartDataFromHistories(sensorHistories));
      } catch (loadError) {
        setDashboardError("Không thể tải dữ liệu khởi tạo.");
      }
    };
    loadDashboardSnapshot();
  }, []);

  useEffect(() => {
    if (!lastDevicePacket || lastDevicePacket.stale) return;
    const {
      deviceId,
      status,
      targetState,
      error: controlError,
    } = lastDevicePacket;
    const normalizedDeviceId = String(deviceId);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === normalizedDeviceId
          ? {
              ...d,
              enabled: targetState === "ON",
              pendingActionId: null,
              errorMessage:
                status === "ON" || status === "OFF" ? null : controlError,
            }
          : d,
      ),
    );
    setLoadingStates((prev) => {
      const next = { ...prev };
      next[normalizedDeviceId] = false;
      return next;
    });
  }, [lastDevicePacket]);

  useEffect(() => {
    const readings = lastSensorPacket?.readings;
    if (!Array.isArray(readings) || readings.length === 0) return;
    lastSensorUpdateTimeRef.current = Date.now();
    setIsSensorOnline(true);
    setSensors((prev) =>
      prev.map((s) => {
        const m = readings.find((r) => r.name === s.id);
        return m ? { ...s, value: Number(m.value) } : s;
      }),
    );

    const packetDate = new Date(lastSensorPacket.timestamp || Date.now());
    const timeKey = Math.round(packetDate.getTime() / 2000) * 2000;
    const formattedTime = formatChartTime(new Date(timeKey));
    setChartData((prev) => {
      const newData = [...prev];
      const idx = newData.findIndex((p) => p.time === formattedTime);
      const nextPoint = { time: formattedTime };
      readings.forEach((r) => {
        nextPoint[r.name] = Number(r.value);
      });
      if (idx >= 0) newData[idx] = { ...newData[idx], ...nextPoint };
      else newData.push(nextPoint);
      return newData.slice(-15);
    });
  }, [lastSensorPacket]);

  const handleDeviceToggle = async (deviceId) => {
    const selected = devices.find((d) => d.id === deviceId);
    if (!selected) return;
    const action = selected.enabled ? "OFF" : "ON";
    setLoadingStates((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const res = await api.post("/device/control", {
        deviceId: selected.backendId,
        action,
      });
      const actionId = Number(res?.data?.actionId);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, pendingActionId: actionId } : d,
        ),
      );
    } catch (e) {
      setLoadingStates((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  const renderCombinedChart = () => {
    if (chartData.length === 0)
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-500">
          Đang tải biểu đồ...
        </div>
      );
    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            vertical={true}
          />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: "11px" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dy={10}
            interval={0}
          />

          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            stroke="#9CA3AF"
            style={{ fontSize: "11px" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dx={-10}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#F59E0B"
            style={{ fontSize: "11px" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            dx={10}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #F3F4F6",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            iconType="circle"
          />
          {sensors.map((s) => {
            const isLight =
              s.name.toLowerCase().includes("light") ||
              s.name.toLowerCase().includes("sáng");
            return (
              <Line
                key={s.id}
                yAxisId={isLight ? "right" : "left"}
                type="monotone"
                dataKey={s.id}
                name={`${s.name} (${s.unit})`}
                stroke={s.color}
                strokeWidth={3}
                connectNulls={true}
                dot={{ fill: s.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-full min-h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* SỬA: Thay overflow-y-auto thành overflow-hidden để KHÓA CUỘN hoàn toàn */}
      <aside className="w-1/4 flex flex-col gap-6 overflow-hidden pr-2 pb-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase">
            Cảm biến
          </h3>
          {sensors.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border p-4 shadow-sm hover:border-blue-200 transition-colors flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: s.bgColor }}
              >
                <s.icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500">{s.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{s.value ?? "--"}</span>
                  <span className="text-sm text-gray-500">{s.unit}</span>
                </div>
              </div>
              <div
                className={`w-2.5 h-2.5 rounded-full ${isSensorOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase">
            Thiết Bị
          </h3>
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => handleDeviceToggle(d.id)}
              disabled={loadingStates[d.id]}
              className={`bg-white rounded-xl border p-4 shadow-sm transition-all flex items-center gap-4 ${d.enabled ? "bg-green-50/30" : ""}`}
              style={{ borderColor: d.enabled ? d.color : "#F3F4F6" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{
                  borderColor: d.enabled ? d.color : "#F3F4F6",
                  backgroundColor: d.enabled ? "white" : "#F9FAFB",
                }}
              >
                {loadingStates[d.id] ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : (
                  <d.icon
                    className={`w-6 h-6 ${d.enabled ? "animate-pulse" : ""}`}
                    style={{ color: d.enabled ? d.color : "#9CA3AF" }}
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{d.name}</p>
                <p
                  className="text-xs"
                  style={{ color: d.errorMessage ? "#EF4444" : "#6B7280" }}
                >
                  {d.errorMessage || (d.enabled ? "Đang bật" : "Đang tắt")}
                </p>
              </div>
              <div
                className="w-12 h-6 rounded-full flex items-center px-1"
                style={{ backgroundColor: d.enabled ? d.color : "#E5E7EB" }}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${d.enabled ? "translate-x-6" : ""}`}
                />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* SỬA: Thay overflow-y-auto thành overflow-hidden để KHÓA CUỘN hoàn toàn */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden pr-2">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Biểu đồ</h3>
                <p className="text-xs text-gray-500 mt-0.5">Thời gian thực</p>
              </div>
            </div>
            <div className="flex gap-2">
              {sensors.map((s) => (
                <div
                  key={`b-${s.id}`}
                  className="px-4 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: s.bgColor,
                    borderColor: `${s.color}40`,
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: s.color }}
                  >
                    {s.value ?? "--"} {s.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full min-h-[450px]">
            {renderCombinedChart()}
          </div>
        </div>
      </main>

      {/* ĐÃ XÓA đoạn CSS custom hide-scrollbar, chỉ giữ lại animation của Tailwind */}
      <style>{`
        .animate-spin-slow { animation: spin 2s linear infinite; }
        .animate-pulse-glow { animation: pulse 1.5s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
