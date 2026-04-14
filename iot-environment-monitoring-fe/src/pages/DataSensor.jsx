import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import { useSensorSocket } from "../hooks/useSensorSocket";

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

const buildPageButtons = (currentPage, totalPages) => {
  const visibleCount = Math.min(5, totalPages);
  if (visibleCount <= 0) {
    return [];
  }

  let startPage = 1;
  if (totalPages > 5) {
    if (currentPage <= 3) {
      startPage = 1;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 4;
    } else {
      startPage = currentPage - 2;
    }
  }

  return Array.from({ length: visibleCount }, (_, index) => startPage + index);
};

export default function DataSensor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSensor, setFilterSensor] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
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

  const fetchSensorRows = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/data-sensors/search", {
        params: {
          pageNo: currentPage,
          pageSize,
          sortBy: "createdAt",
          sortOrder,
          sensorName: filterSensor === "all" ? undefined : filterSensor,
          q: searchTerm.trim() || undefined,
        },
      });

      const nextRows = Array.isArray(response?.data) ? response.data : [];
      const nextPagination = response?.pagination || {};

      setRows(nextRows);
      setPagination({
        totalRecords: Number(nextPagination.totalRecords ?? nextPagination.total ?? 0),
        totalPages: Number(nextPagination.totalPages ?? 1),
        currentPage: Number(nextPagination.currentPage ?? nextPagination.pageNo ?? currentPage),
        pageSize: Number(nextPagination.pageSize ?? pageSize),
      });
      setError(null);
    } catch (requestError) {
      setError(requestError.message || "Không tải được dữ liệu cảm biến");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortOrder, filterSensor, searchTerm]);

  useEffect(() => {
    fetchSensorRows();
  }, [fetchSensorRows]);

  useEffect(() => {
    if (!lastSensorPacket) {
      return;
    }

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      fetchSensorRows();
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
  const pageButtons = useMemo(
    () => buildPageButtons(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const displayStart =
    pagination.totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const displayEnd =
    pagination.totalRecords > 0
      ? displayStart + Math.max(0, rows.length - 1)
      : 0;

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
    const parsedSize = Number.parseInt(value, 10);
    if (!Number.isFinite(parsedSize)) {
      return;
    }

    const safeSize = Math.min(Math.max(parsedSize, 1), 100);
    setPageSize(safeSize);
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo thời gian, cảm biến hoặc giá trị..."
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterSensor}
            onChange={(event) => handleSensorChange(event.target.value)}
            className="appearance-none pl-4 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500 cursor-pointer font-medium text-gray-700"
          >
            {SENSOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setSortOrder((prevSort) =>
                prevSort === "asc" ? "desc" : "asc",
              )
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all text-gray-700"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "desc" ? "Mới nhất" : "Cũ nhất"}
          </button>

          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
            <span className="text-sm text-gray-600">/trang</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(event) => handlePageSizeChange(event.target.value)}
              className="w-16 text-sm font-medium text-gray-700 focus:outline-none"
            />
          </div>
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
                const sensorName = record?.sensorInfo?.name || "";
                const sensorMeta = SENSOR_UI_META[sensorName] || {
                  label: sensorName || "Không xác định",
                  textClass: "text-gray-500",
                  borderClass: "border-gray-200",
                  dotClass: "bg-gray-400",
                };

                return (
                  <tr
                    key={record.id}
                    className="bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-600">#{record.id}</td>
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
                      {formatSensorValue(sensorName, record.value)}
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

      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
        <div className="font-medium text-gray-600">
          <span className="text-gray-900">
            {displayStart}-{displayEnd}
          </span>
          / {pagination.totalRecords}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {pageButtons.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`w-8 h-8 rounded-md flex items-center justify-center font-medium transition-colors ${
                currentPage === pageNum
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
