import { createContext, useContext, useState, useCallback } from "react";

/**
 * Context để quản lý dữ liệu sensor
 */
const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  // Sensors list
  const [sensors, setSensors] = useState([
    // Mock data - replace with real API later
    {
      id: 1,
      name: "Temperature Sensor",
      type: "temperature",
      location: "Room 101",
      unit: "°C",
      lastValue: 25.5,
      status: "active",
    },
    {
      id: 2,
      name: "Humidity Sensor",
      type: "humidity",
      location: "Room 101",
      unit: "%",
      lastValue: 60.2,
      status: "active",
    },
    {
      id: 3,
      name: "Light Sensor",
      type: "light",
      location: "Room 101",
      unit: "lux",
      lastValue: 450,
      status: "active",
    },
  ]);

  // Real-time data para masing-masing sensor
  const [realtimeData, setRealtimeData] = useState({});

  // Selected sensor
  const [selectedSensor, setSelectedSensor] = useState(sensors[0]);

  // Historical data
  const [historicalData, setHistoricalData] = useState({});

  // Actions/History
  const [actions, setActions] = useState([
    {
      id: 1,
      type: "manual_control",
      description: "Started monitoring",
      timestamp: new Date().toISOString(),
      sensorId: 1,
    },
  ]);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addRealTimeData = useCallback((sensorId, value) => {
    setRealtimeData((prev) => ({
      ...prev,
      [sensorId]: {
        ...(prev[sensorId] || {}),
        value,
        timestamp: new Date().toISOString(),
      },
    }));

    // Update sensor last value
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id === sensorId ? { ...sensor, lastValue: value } : sensor,
      ),
    );
  }, []);

  const setHistoricalDataForSensor = useCallback((sensorId, data) => {
    setHistoricalData((prev) => ({
      ...prev,
      [sensorId]: data,
    }));
  }, []);

  const addAction = useCallback((action) => {
    setActions((prev) => [
      { ...action, id: Math.random(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const value = {
    // State
    sensors,
    realtimeData,
    selectedSensor,
    historicalData,
    actions,
    loading,
    error,

    // Actions
    setSensors,
    setSelectedSensor,
    addRealTimeData,
    setHistoricalDataForSensor,
    addAction,
    setLoading,
    setError,
  };

  return (
    <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
  );
};

/**
 * Hook để sử dụng SensorContext
 */
export const useSensorContext = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error("useSensorContext must be used within SensorProvider");
  }
  return context;
};
