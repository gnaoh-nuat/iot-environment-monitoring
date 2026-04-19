import { Loader2, AlertCircle } from "lucide-react";

export default function DevicePanel({
  devices,
  loadingStates,
  onToggleDevice,
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 mt-2">
        Thiết bị
      </h3>

      {devices.map((device) => {
        const DeviceIcon = device.icon;
        const isLoading = loadingStates[device.id];
        const hasError = !!device.errorMessage;

        return (
          <button
            key={device.id}
            onClick={() => onToggleDevice(device.id)}
            disabled={isLoading}
            className={`relative w-full bg-white rounded-2xl border p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-center gap-4 text-left focus:outline-none ${
              device.enabled ? "hover:brightness-95" : "hover:bg-gray-50"
            } ${isLoading ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
            style={{
              borderColor: hasError
                ? "#FECACA"
                : device.enabled
                  ? device.color
                  : "#F1F5F9",
              // Phủ một lớp màu cực nhạt (8% opacity) lên background khi bật
              backgroundColor: device.enabled ? `${device.color}08` : "#ffffff",
            }}
          >
            {/* Cụm Icon */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                !device.enabled && !hasError
                  ? "bg-slate-50 border border-slate-100"
                  : ""
              }`}
              style={{
                backgroundColor: hasError
                  ? "#FEF2F2"
                  : device.enabled
                    ? "white"
                    : undefined,
                boxShadow: device.enabled
                  ? `0 4px 12px ${device.color}20`
                  : "none",
              }}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : hasError ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : (
                <DeviceIcon
                  className={`w-6 h-6 transition-all duration-300 ${device.enabled ? "scale-110" : "scale-100 opacity-60"}`}
                  style={{ color: device.enabled ? device.color : "#64748B" }}
                />
              )}
            </div>

            {/* Cụm Text */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-[14px] font-bold truncate transition-colors ${hasError ? "text-red-600" : "text-slate-800"}`}
              >
                {device.name}
              </p>
              <p
                className={`text-[11px] leading-snug mt-0.5 truncate ${hasError ? "text-red-500 font-medium" : "text-slate-500"}`}
                title={device.errorMessage || ""} // Di chuột vào để xem full lỗi
              >
                {hasError
                  ? "Mất kết nối / Không phản hồi" // Rút gọn lỗi cho gọn gàng
                  : device.enabled
                    ? "Đang hoạt động"
                    : "Đã tắt"}
              </p>
            </div>

            {/* Công tắc Toggle chuẩn iOS */}
            <div
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-300 flex-shrink-0 ${hasError ? "opacity-50" : ""}`}
              style={{
                backgroundColor: device.enabled ? device.color : "#E2E8F0",
              }}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${
                  device.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
