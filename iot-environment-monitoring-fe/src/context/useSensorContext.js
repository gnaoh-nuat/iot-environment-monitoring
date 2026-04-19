import { useContext } from "react";
import { SensorContext } from "./SensorContextStore";

export const useSensorContext = () => {
  const context = useContext(SensorContext);

  if (!context) {
    throw new Error("useSensorContext must be used within SensorProvider");
  }

  return context;
};
