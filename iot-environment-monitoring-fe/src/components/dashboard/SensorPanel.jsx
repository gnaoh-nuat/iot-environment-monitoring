export default function SensorPanel({ sensors, isSensorOnline }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
        Cảm biến
      </h3>

      {sensors.map((sensor) => {
        const SensorIcon = sensor.icon;

        return (
          <div
            key={sensor.id}
            className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
          >
            {/* Hiệu ứng viền mờ bên trái khi hover */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: sensor.color }}
            />

            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: sensor.bgColor }}
            >
              <SensorIcon className="w-6 h-6" style={{ color: sensor.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-500 mb-0.5 truncate">
                {sensor.name}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-slate-800">
                  {sensor.value ?? "--"}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {sensor.unit}
                </span>
              </div>
            </div>

            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isSensorOnline
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"
                  : "bg-gray-300"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
