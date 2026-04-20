import { Loader2, AlertCircle, Fan, Lightbulb, Droplets } from "lucide-react";

export default function DevicePanel({
  devices,
  loadingStates,
  onToggleDevice,
}) {
  const ORDERED_COLORS = ["#EF4444", "#22C55E", "#EAB308"];
  const ORDERED_ICONS = [Fan, Lightbulb, Droplets];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 mt-2">
        Thiết bị
      </h3>

      {devices.map((device, index) => {
        const DeviceIcon = ORDERED_ICONS[index] || device.icon || Fan;

        const isLoading = loadingStates[device.id];
        const hasError = !!device.errorMessage;
        const activeColor = ORDERED_COLORS[index] || device.color || "#3B82F6";

        let effectClass = "";
        let shadowStyle = "none";

        if (device.enabled && !hasError && !isLoading) {
          if (index === 0) {
            // Thêm origin-center để đảm bảo quạt quay quanh đúng tâm
            effectClass = "animate-spin origin-center";
          } else if (index === 1) {
            effectClass = "animate-pulse";
            shadowStyle = `drop-shadow(0 0 8px ${activeColor})`;
          } else if (index === 2) {
            effectClass = "animate-bounce";
            shadowStyle = `drop-shadow(0 4px 6px ${activeColor}80)`;
          }
        }

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
                  ? activeColor
                  : "#F1F5F9",
              backgroundColor: device.enabled ? `${activeColor}08` : "#ffffff",
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
                  ? `0 4px 12px ${activeColor}20`
                  : "none",
              }}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : hasError ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : (
                /* BẢN VÁ LỖI NẰM Ở ĐÂY: Tách thẻ div bọc ngoài để xử lý scale và opacity */
                <div
                  className={`transition-all duration-300 flex items-center justify-center ${
                    device.enabled ? "scale-110" : "scale-100 opacity-60"
                  }`}
                >
                  <DeviceIcon
                    className={`w-6 h-6 ${effectClass}`}
                    style={{
                      color: device.enabled ? activeColor : "#64748B",
                      filter: shadowStyle !== "none" ? shadowStyle : undefined,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Cụm Text */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-[14px] font-bold truncate transition-colors ${
                  hasError ? "text-red-600" : "text-slate-800"
                }`}
              >
                {device.name}
              </p>
              <p
                className={`text-[11px] leading-snug mt-0.5 truncate ${
                  hasError ? "text-red-500 font-medium" : "text-slate-500"
                }`}
                title={device.errorMessage || ""}
              >
                {hasError
                  ? "Mất kết nối / Không phản hồi"
                  : device.enabled
                    ? "Đang hoạt động"
                    : "Đã tắt"}
              </p>
            </div>

            {/* Công tắc Toggle chuẩn iOS */}
            <div
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-300 flex-shrink-0 ${
                hasError ? "opacity-50" : ""
              }`}
              style={{
                backgroundColor: device.enabled ? activeColor : "#E2E8F0",
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
