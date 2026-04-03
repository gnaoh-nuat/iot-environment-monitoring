import { useState } from "react";
import { FiPower, FiSun, FiDroplet, FiWind } from "react-icons/fi";

const controlMeta = {
  fan: { icon: FiWind },
  led1: { icon: FiSun },
  led2: { icon: FiDroplet },
};

const DeviceControlCard = ({ device }) => {
  const [isActive, setIsActive] = useState(device.active);
  const meta = controlMeta[device.id] || {};
  const Icon = meta.icon || FiPower;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border border-gray-100">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-white border border-gray-100 mr-4">
          <Icon size={20} className="text-gray-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{device.name}</p>
          <p className="text-sm text-gray-500">{device.description}</p>
        </div>
      </div>
      <button
        onClick={() => setIsActive(!isActive)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isActive ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isActive ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default DeviceControlCard;
