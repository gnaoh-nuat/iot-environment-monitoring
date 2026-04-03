import { useState, useEffect } from "react";
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

export default function Dashboard() {
  const [sensors, setSensors] = useState([
    {
      id: "temp",
      name: "Nhiệt độ",
      value: 28.5,
      unit: "°C",
      icon: Thermometer,
      color: "#EF4444",
      bgColor: "#FEE2E2",
    },
    {
      id: "humidity",
      name: "Độ ẩm",
      value: 65,
      unit: "%",
      icon: Droplets,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      id: "light",
      name: "Ánh sáng",
      value: 450,
      unit: "Lux",
      icon: Sun,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
  ]);

  const [devices, setDevices] = useState([
    {
      id: "fan",
      name: "Quạt thông gió",
      icon: Fan,
      color: "#10B981",
      enabled: false,
    },
    {
      id: "light",
      name: "Đèn LED",
      icon: Lightbulb,
      color: "#F59E0B",
      enabled: false,
    },
    {
      id: "pump",
      name: "Máy bơm nước",
      icon: Droplet,
      color: "#3B82F6",
      enabled: false,
    },
  ]);

  const [loadingStates, setLoadingStates] = useState({});

  // Mock chart data (Dữ liệu tĩnh cho biểu đồ)
  const [chartData] = useState([
    { time: "10:00", temperature: 25, humidity: 60, light: 400 },
    { time: "10:15", temperature: 26, humidity: 62, light: 420 },
    { time: "10:30", temperature: 27, humidity: 63, light: 435 },
    { time: "10:45", temperature: 27.5, humidity: 64, light: 445 },
    { time: "11:00", temperature: 28, humidity: 65, light: 448 },
    { time: "11:15", temperature: 28.5, humidity: 65, light: 450 },
  ]);

  // Xử lý bật/tắt thiết bị với hiệu ứng loading giả lập
  const handleDeviceToggle = async (deviceId) => {
    setLoadingStates((prev) => ({ ...prev, [deviceId]: true }));
    // Giả lập độ trễ gọi API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? { ...device, enabled: !device.enabled }
          : device,
      ),
    );
    setLoadingStates((prev) => ({ ...prev, [deviceId]: false }));
  };

  // Giả lập Real-time cập nhật số liệu cảm biến (Cards) mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((sensor) => ({
          ...sensor,
          value:
            sensor.id === "temp"
              ? Number((sensor.value + (Math.random() - 0.5) * 0.5).toFixed(1))
              : sensor.id === "humidity"
                ? Math.round(sensor.value + (Math.random() - 0.5) * 2)
                : Math.round(sensor.value + (Math.random() - 0.5) * 10),
        })),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    // Sử dụng h-full và overflow-hidden để khóa khung, mượn padding từ MainLayout
    <div className="h-full flex gap-6 overflow-hidden">
      {/* --- CỘT TRÁI: CẢM BIẾN & ĐIỀU KHIỂN --- */}
      <aside className="w-1/4 flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
        {/* Sensors Section */}
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
                          {sensor.value}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          {sensor.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-200"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Controls Section */}
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
                  className={`
                    bg-white rounded-xl border p-4 transition-all duration-300 text-left shadow-sm
                    ${device.enabled ? "border-green-400 bg-green-50/30" : "border-gray-100 hover:border-gray-300"}
                    ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all
                        ${device.enabled ? "border-green-200 bg-white shadow-sm" : "border-gray-100 bg-gray-50"}
                      `}
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
                        {device.enabled ? "Đang hoạt động" : "Nhấn để bật"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`
                          w-12 h-6 rounded-full border-2 flex items-center transition-all px-0.5
                          ${device.enabled ? "bg-green-500 border-green-500" : "bg-gray-200 border-gray-200"}
                        `}
                      >
                        <div
                          className={`
                            w-4 h-4 bg-white rounded-full transition-transform shadow-sm
                            ${device.enabled ? "translate-x-6" : "translate-x-0"}
                          `}
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

      {/* --- CỘT PHẢI: BIỂU ĐỒ RECHARTS --- */}
      <main className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
        {/* Temperature & Humidity Chart */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
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
                  {sensors[0].value}°C
                </span>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                <span className="text-sm font-bold text-blue-600">
                  {sensors[1].value}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  dy={10}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                  domain={[0, 100]}
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
          </div>
        </div>

        {/* Light Chart */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
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
                {sensors[2].value} Lux
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  dy={10}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                  domain={[300, 500]}
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
                  dataKey="light"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  name="Ánh sáng (Lux)"
                  dot={{
                    fill: "#F59E0B",
                    r: 4,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      {/* --- CSS CHO CÁC HIỆU ỨNG CHUYỂN ĐỘNG --- */}
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
