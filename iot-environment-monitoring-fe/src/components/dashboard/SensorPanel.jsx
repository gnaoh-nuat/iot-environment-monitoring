export default function SensorPanel({ sensors, isSensorOnline }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase">Cảm biến</h3>

      {sensors.map((sensor) => {
        const SensorIcon = sensor.icon;

        return (
          <div
            key={sensor.id}
            className="bg-white rounded-xl border p-4 shadow-sm hover:border-blue-200 transition-colors flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: sensor.bgColor }}
            >
              <SensorIcon className="w-6 h-6" style={{ color: sensor.color }} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-500">
                {sensor.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {sensor.value ?? "--"}
                </span>
                <span className="text-sm text-gray-500">{sensor.unit}</span>
              </div>
            </div>

            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isSensorOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
