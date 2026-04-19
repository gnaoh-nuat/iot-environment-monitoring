import { Loader2 } from "lucide-react";

export default function DevicePanel({
  devices,
  loadingStates,
  onToggleDevice,
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase">Thiết bị</h3>

      {devices.map((device) => {
        const DeviceIcon = device.icon;

        return (
          <button
            key={device.id}
            onClick={() => onToggleDevice(device.id)}
            disabled={loadingStates[device.id]}
            className={`bg-white rounded-xl border p-4 shadow-sm transition-all flex items-center gap-4 ${
              device.enabled ? "bg-green-50/30" : ""
            }`}
            style={{ borderColor: device.enabled ? device.color : "#F3F4F6" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{
                borderColor: device.enabled ? device.color : "#F3F4F6",
                backgroundColor: device.enabled ? "white" : "#F9FAFB",
              }}
            >
              {loadingStates[device.id] ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <DeviceIcon
                  className={`w-6 h-6 ${device.enabled ? "animate-pulse" : ""}`}
                  style={{ color: device.enabled ? device.color : "#9CA3AF" }}
                />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{device.name}</p>
              <p
                className="text-xs"
                style={{ color: device.errorMessage ? "#EF4444" : "#6B7280" }}
              >
                {device.errorMessage ||
                  (device.enabled ? "Đang bật" : "Đang tắt")}
              </p>
            </div>

            <div
              className="w-12 h-6 rounded-full flex items-center px-1"
              style={{
                backgroundColor: device.enabled ? device.color : "#E5E7EB",
              }}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  device.enabled ? "translate-x-6" : ""
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
