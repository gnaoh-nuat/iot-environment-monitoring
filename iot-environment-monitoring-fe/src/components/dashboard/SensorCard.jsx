import { FiThermometer, FiDroplet, FiSun } from "react-icons/fi";

const sensorMeta = {
  temperature: {
    label: "Nhiệt độ",
    unit: "°C",
    icon: FiThermometer,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  humidity: {
    label: "Độ ẩm",
    unit: "%",
    icon: FiDroplet,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  light: {
    label: "Ánh sáng",
    unit: "Lux",
    icon: FiSun,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
};

const SensorCard = ({ sensor }) => {
  const meta = sensorMeta[sensor.type] || {};
  const Icon = meta.icon || FiThermometer;

  return (
    <div className="flex items-center p-4 rounded-lg bg-white shadow-sm border border-gray-100">
      <div className={`p-2 rounded-full ${meta.bgColor} ${meta.color} mr-4`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{meta.label}</p>
        <p className="text-2xl font-bold text-gray-800">
          {sensor.lastValue}
          <span className="text-lg text-gray-500 font-normal">
            {" "}
            {meta.unit}
          </span>
        </p>
      </div>
      <div className="ml-auto h-2 w-2 rounded-full bg-green-500"></div>
    </div>
  );
};

export default SensorCard;
