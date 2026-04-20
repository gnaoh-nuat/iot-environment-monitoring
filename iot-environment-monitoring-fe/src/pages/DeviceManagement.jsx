import { CalendarDays, RefreshCw } from "lucide-react";
import { ChartSkeleton } from "../components/Skeleton";
import DailyToggleChart from "../components/device-management/DailyToggleChart";
import { useDeviceManagementData } from "../hooks/useDeviceManagementData";

export default function DeviceManagement() {
  const {
    selectedDate,
    setSelectedDate,
    timezone,
    devices,
    countsByDevice,
    loading,
    error,
    refresh,
  } = useDeviceManagementData();

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Device Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thống kê số lần bật/tắt thành công theo ngày ({timezone})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="daily-device-date"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            <CalendarDays className="w-4 h-4" />
            <input
              id="daily-device-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-transparent outline-none text-sm"
            />
          </label>

          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && devices.length < 5 ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Hiện có {devices.length}/5 thiết bị trong cơ sở dữ liệu. Hãy tạo thêm
          thiết bị qua API /devices để đủ dữ liệu theo yêu cầu.
        </div>
      ) : null}

      <div className="flex-1 min-h-0">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <DailyToggleChart
            rows={countsByDevice}
            selectedDate={selectedDate}
            timezone={timezone}
          />
        )}
      </div>
    </div>
  );
}
