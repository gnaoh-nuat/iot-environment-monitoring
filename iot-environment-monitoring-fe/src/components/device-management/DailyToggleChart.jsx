import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const onValue = Number(
    payload.find((item) => item.dataKey === "onCount")?.value || 0,
  );
  const offValue = Number(
    payload.find((item) => item.dataKey === "offCount")?.value || 0,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-xs text-green-600 font-semibold">Bật: {onValue}</p>
      <p className="text-xs text-slate-600 font-semibold">Tắt: {offValue}</p>
      <p className="text-xs text-slate-500 mt-1">Tổng: {onValue + offValue}</p>
    </div>
  );
};

export default function DailyToggleChart({ rows, selectedDate, timezone }) {
  const chartRows = Array.isArray(rows) ? rows : [];

  const totalOn = chartRows.reduce(
    (sum, row) => sum + Number(row.onCount || 0),
    0,
  );
  const totalOff = chartRows.reduce(
    (sum, row) => sum + Number(row.offCount || 0),
    0,
  );

  if (chartRows.length === 0) {
    return (
      <div className="h-full min-h-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-center text-slate-500 text-sm">
        Không có dữ liệu bật/tắt trong ngày đã chọn.
      </div>
    );
  }

  return (
    <div className="h-full min-h-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Số lần bật/tắt theo thiết bị
            </h3>
            <p className="text-xs text-slate-500">
              Ngày {selectedDate} ({timezone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 font-semibold">
            Tổng bật: {totalOn}
          </span>
          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
            Tổng tắt: {totalOff}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartRows}
            margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="deviceName"
              stroke="#94A3B8"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "12px", fontWeight: 600 }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#94A3B8"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "12px", fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", fontWeight: 600 }}
              iconType="circle"
            />
            <Bar
              dataKey="onCount"
              name="Bật (ON)"
              fill="#22C55E"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="offCount"
              name="Tắt (OFF)"
              fill="#64748B"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
