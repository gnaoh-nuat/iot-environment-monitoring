import { Activity } from "lucide-react";
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

// TẠO TOOLTIP TÙY CHỈNH (HIỆU ỨNG GLASSMORPHISM XỊN XÒ)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] min-w-[160px]">
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">
          {label}
        </p>
        <div className="flex flex-col gap-2.5">
          {payload.map((entry, index) => {
            // Lọc bớt chữ "(°C)", "(%)" trong name để hiển thị cho gọn
            const cleanName = String(entry.name).split(" ")[0];

            // ĐÃ SỬA: Kiểm tra nếu tên có chứa chữ "Lux" thì làm tròn giá trị
            const isLight = String(entry.name).includes("Lux");
            const displayValue = isLight
              ? Math.round(entry.value)
              : entry.value;

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-600 text-[13px] font-semibold">
                    {cleanName}
                  </span>
                </div>
                <span className="text-slate-900 text-[14px] font-bold">
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

function ChartBody({ sensors, chartData }) {
  if (chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium text-sm animate-pulse">
        Đang đồng bộ dữ liệu biểu đồ...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="#F1F5F9"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          stroke="#94A3B8"
          style={{ fontSize: "11px", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          dy={15}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          stroke="#94A3B8"
          style={{ fontSize: "11px", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          dx={-10}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#CBD5E1"
          style={{ fontSize: "11px", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          dx={10}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#E2E8F0", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Legend
          wrapperStyle={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748B",
            paddingTop: "12px",
          }}
          iconType="circle"
          iconSize={8}
        />
        {sensors.map((sensor) => {
          const sensorName = String(sensor.name || "").toLowerCase();
          const isLight =
            sensorName.includes("light") || sensorName.includes("sáng");

          return (
            <Line
              key={sensor.id}
              yAxisId={isLight ? "right" : "left"}
              type="monotone"
              dataKey={sensor.id}
              name={`${sensor.name} ${sensor.unit ? `(${sensor.unit})` : ""}`}
              stroke={sensor.color}
              strokeWidth={3}
              connectNulls
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 3,
                stroke: "#ffffff",
                fill: sensor.color,
                style: { filter: `drop-shadow(0px 4px 6px ${sensor.color}40)` },
              }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardRealtimeChart({ sensors, chartData }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] border border-slate-100 p-4 flex flex-col flex-1 min-h-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-center shadow-inner">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>

          <div>
            <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">
              Biểu đồ
            </h3>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              Dữ liệu thời gian thực
            </p>
          </div>
        </div>

        {/* ĐÃ SỬA: Các Badge hiển thị thông số thu gọn trên góc phải */}
        <div className="flex flex-wrap justify-end gap-2 max-w-[55%]">
          {sensors.map((sensor) => (
            <div
              key={`badge-${sensor.id}`}
              className="px-2.5 py-1 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: `${sensor.bgColor}40`,
                borderColor: `${sensor.color}20`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: sensor.color }}
              />
              <span
                className="text-[12px] font-bold"
                style={{ color: sensor.color }}
              >
                {sensor.value !== null && sensor.value !== undefined
                  ? sensor.unit === "Lux"
                    ? Math.round(sensor.value)
                    : sensor.value
                  : "--"}{" "}
                <span className="opacity-70 font-medium text-[10px]">
                  {sensor.unit}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ChartBody sensors={sensors} chartData={chartData} />
      </div>
    </div>
  );
}
