import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

const getTodayDateString = () => {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

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
      const response = await api.get("/actions/device-management/daily", {
        params: {
          date: selectedDate,
          timezone: DEFAULT_TIMEZONE,
        },
      });

      const payload = response?.data || {};

      setStatsData({
        devices: Array.isArray(payload.devices) ? payload.devices : [],
        countsByDevice: Array.isArray(payload.countsByDevice)
          ? payload.countsByDevice
          : [],
      });
      setError(null);
    } catch (requestError) {
      setError(requestError.message || "Không tải được thống kê thiết bị");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  const countsByDevice = useMemo(
    () => statsData.countsByDevice,
    [statsData.countsByDevice],
  );

  return {
    selectedDate,
    setSelectedDate,
    timezone: DEFAULT_TIMEZONE,
    devices: statsData.devices,
    countsByDevice,
    loading,
    error,
    refresh: fetchDailyStats,
  };
};
