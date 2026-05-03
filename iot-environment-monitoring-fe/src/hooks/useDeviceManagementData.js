import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

const getTodayDateString = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: DEFAULT_TIMEZONE });

export const useDeviceManagementData = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [statsData, setStatsData] = useState({
    devices: [],
    countsByDevice: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDailyStats = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get("/actions/device-management/daily", {
        params: {
          date: selectedDate,
          timezone: DEFAULT_TIMEZONE,
        },
      });

      setStatsData({
        devices: data?.devices || [],
        countsByDevice: data?.countsByDevice || [],
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Không tải được thống kê thiết bị");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  return {
    selectedDate,
    setSelectedDate,
    timezone: DEFAULT_TIMEZONE,
    devices: statsData.devices,
    countsByDevice: statsData.countsByDevice,
    loading,
    error,
    refresh: fetchDailyStats,
  };
};
