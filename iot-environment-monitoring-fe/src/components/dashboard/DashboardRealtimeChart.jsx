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

function ChartBody({ sensors, chartData }) {
  if (chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        Đang tải biểu đồ...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={400}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical />

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
              name={`${sensor.name} (${sensor.unit})`}
              stroke={sensor.color}
              strokeWidth={3}
              connectNulls
              dot={{ fill: sensor.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardRealtimeChart({ sensors, chartData }) {
  return (
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
          {sensors.map((sensor) => (
            <div
              key={`badge-${sensor.id}`}
              className="px-4 py-1.5 rounded-full border"
              style={{
                backgroundColor: sensor.bgColor,
                borderColor: `${sensor.color}40`,
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: sensor.color }}
              >
                {sensor.value ?? "--"} {sensor.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[450px]">
        <ChartBody sensors={sensors} chartData={chartData} />
      </div>
    </div>
  );
}
