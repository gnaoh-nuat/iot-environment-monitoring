import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useSensorSocket } from "../hooks/useSensorSocket";
import Pagination from "../components/Pagination";
import SearchBar from "../components/filters/SearchBar";
import FilterSelect from "../components/filters/FilterSelect";
import PageSizeInput from "../components/filters/PageSizeInput";

const SENSOR_OPTIONS = [
  { value: "all", label: "Tất cả cảm biến" },
  { value: "temperature", label: "Nhiệt độ" },
  { value: "humidity", label: "Độ ẩm" },
  { value: "light", label: "Ánh sáng" },
];

const SENSOR_UI_META = {
  temperature: {
    label: "Nhiệt độ",
    textClass: "text-red-500",
    borderClass: "border-red-200",
    dotClass: "bg-red-500",
  },
  humidity: {
    label: "Độ ẩm",
    textClass: "text-blue-500",
    borderClass: "border-blue-200",
    dotClass: "bg-blue-500",
  },
  light: {
    label: "Ánh sáng",
    textClass: "text-amber-500",
    borderClass: "border-amber-200",
    dotClass: "bg-amber-500",
  },
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const resolveSensorType = (sensorName) => {
  const normalizedName = normalizeText(sensorName);

  if (/(temperature|temp|nhiet)/.test(normalizedName)) {
    return "temperature";
  }

  if (/(humidity|humid|do am|am)/.test(normalizedName)) {
    return "humidity";
  }

  if (/(light|anh sang|lux|sang)/.test(normalizedName)) {
    return "light";
  }

  return null;
};

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const formatSensorValue = (sensorName, rawValue) => {
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return String(rawValue ?? "--");
  }

  if (sensorName === "temperature") {
    return `${numericValue.toFixed(1)}°C`;
  }

  if (sensorName === "humidity") {
    return `${numericValue.toFixed(0)}%`;
  }

  if (sensorName === "light") {
    return `${numericValue.toFixed(0)} Lux`;
  }

  return `${numericValue}`;
};

export default function DataSensor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSensor, setFilterSensor] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });

  const refreshTimerRef = useRef(null);
  const { lastSensorPacket } = useSensorSocket();

  const fetchSensorRows = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true);
      }

      try {
        const response = await api.get("/data-sensors/search", {
          params: {
            pageNo: currentPage,
            pageSize,
            sortBy: "createdAt",
            sortOrder: "desc",
            sensorName: filterSensor === "all" ? undefined : filterSensor,
            q: searchTerm.trim() || undefined,
          },
        });

        const nextRows = Array.isArray(response?.data) ? response.data : [];
        const nextPagination = response?.pagination || {};

        setRows(nextRows);
        setPagination({
          totalRecords: Number(
            nextPagination.totalRecords ?? nextPagination.total ?? 0,
          ),
          totalPages: Number(nextPagination.totalPages ?? 1),
          currentPage: Number(
            nextPagination.currentPage ?? nextPagination.pageNo ?? currentPage,
          ),
          pageSize: Number(nextPagination.pageSize ?? pageSize),
        });
        setError(null);
      } catch (requestError) {
        setError(requestError.message || "Không tải được dữ liệu cảm biến");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, filterSensor, searchTerm],
  );

  useEffect(() => {
    fetchSensorRows(false);
  }, [fetchSensorRows]);

  useEffect(() => {
    if (!lastSensorPacket) {
      return;
    }

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      fetchSensorRows(true);
    }, 300);
  }, [lastSensorPacket, fetchSensorRows]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const totalPages = Math.max(1, pagination.totalPages || 1);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSensorChange = (value) => {
    setFilterSensor(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm theo thời gian, cảm biến hoặc giá trị..."
        />

        <div className="flex items-center gap-3 flex-wrap">
          <FilterSelect
            value={filterSensor}
            onChange={handleSensorChange}
            options={SENSOR_OPTIONS}
          />

          <PageSizeInput pageSize={pageSize} onChange={handlePageSizeChange} />
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-semibold">ID</th>
              <th className="px-6 py-4 font-semibold">Cảm biến</th>
              <th className="px-6 py-4 font-semibold">Giá trị</th>
              <th className="px-6 py-4 font-semibold">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Không có dữ liệu phù hợp
                </td>
              </tr>
            ) : (
              rows.map((record) => {
                const dbSensorName = record?.sensorInfo?.name || "";
                const sensorType = resolveSensorType(dbSensorName);
                const sensorMeta = SENSOR_UI_META[sensorType] || {
                  label: dbSensorName || "Không xác định",
                  textClass: "text-gray-500",
                  borderClass: "border-gray-200",
                  dotClass: "bg-gray-400",
                };

                return (
                  <tr
                    key={record.id}
                    className="bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-600">
                      #{record.id}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${sensorMeta.textClass} ${sensorMeta.borderClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-2 ${sensorMeta.dotClass}`}
                        />
                        {sensorMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {formatSensorValue(sensorType, record.value)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDateTime(record.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
