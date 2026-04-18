import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle, XCircle, Clock3 } from "lucide-react";
import api from "../services/api";
import { useSensorSocket } from "../hooks/useSensorSocket";
import Pagination from "../components/Pagination";
import SearchBar from "../components/filters/SearchBar";
import FilterSelect from "../components/filters/FilterSelect";
import PageSizeInput from "../components/filters/PageSizeInput";

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

const toActionLabel = (action) => {
  const normalizedAction = String(action || "").toUpperCase();
  if (normalizedAction === "ON") {
    return "Bật";
  }
  if (normalizedAction === "OFF") {
    return "Tắt";
  }
  return String(action || "--");
};

const detectStatusGroup = (row) => {
  const action = String(row?.action || "").toUpperCase();
  const status = String(row?.status || "").toUpperCase();

  if (status === "PENDING") {
    return "pending";
  }

  if (["ON", "OFF"].includes(status) && action === status) {
    return "success";
  }

  return "failure";
};

const getStatusUI = (group) => {
  if (group === "success") {
    return {
      icon: CheckCircle,
      dotClass: "bg-green-500",
      textClass: "text-green-700",
      label: "Thành công",
    };
  }

  if (group === "pending") {
    return {
      icon: Clock3,
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
      label: "Đang chờ",
    };
  }

  return {
    icon: XCircle,
    dotClass: "bg-red-500",
    textClass: "text-red-600",
    label: "Thất bại",
  };
};

export default function ActionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDevice, setFilterDevice] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatusGroup, setFilterStatusGroup] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });

  const refreshTimerRef = useRef(null);
  const { lastDevicePacket } = useSensorSocket();

  const fetchDeviceOptions = useCallback(async () => {
    try {
      const response = await api.get("/devices");
      const deviceRows = Array.isArray(response?.data) ? response.data : [];
      setDeviceOptions(deviceRows);
    } catch (deviceError) {
      console.error("Không tải được danh sách thiết bị:", deviceError);
    }
  }, []);

  const fetchActionRows = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true);
      }

      try {
        const response = await api.get("/actions/search", {
          params: {
            pageNo: currentPage,
            pageSize,
            deviceName: filterDevice === "all" ? undefined : filterDevice,
            action: filterAction === "all" ? undefined : filterAction,
            statusGroup:
              filterStatusGroup === "all" ? undefined : filterStatusGroup,
            q: searchTerm.trim() || undefined,
            sortBy,
            sortOrder,
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
        setError(requestError.message || "Không tải được lịch sử hành động");
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      filterAction,
      filterDevice,
      filterStatusGroup,
      pageSize,
      searchTerm,
      sortBy,
      sortOrder,
    ],
  );

  useEffect(() => {
    fetchDeviceOptions();
  }, [fetchDeviceOptions]);

  useEffect(() => {
    fetchActionRows(false);
  }, [fetchActionRows]);

  useEffect(() => {
    if (!lastDevicePacket) {
      return;
    }

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      fetchActionRows(true);
    }, 300);
  }, [lastDevicePacket, fetchActionRows]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handlePageChange = (page) => {
    const totalPages = Math.max(1, pagination.totalPages || 1);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (setter, value, shouldResetPage = true) => {
    setter(value);
    if (shouldResetPage) {
      setCurrentPage(1);
    }
  };

  const handleSortToggle = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
      setCurrentPage(1);
      return;
    }

    setSortBy(columnKey);
    setSortOrder(columnKey === "createdAt" ? "desc" : "asc");
    setCurrentPage(1);
  };

  const renderSortHeader = (
    label,
    columnKey,
    thClassName = "",
    buttonClassName = "",
  ) => {
    const isActive = sortBy === columnKey;

    return (
      <th className={`px-6 py-4 font-semibold ${thClassName}`}>
        <button
          type="button"
          onClick={() => handleSortToggle(columnKey)}
          className={`group flex items-center gap-1.5 font-semibold transition-colors focus:outline-none ${
            isActive ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
          } ${buttonClassName}`}
          title={
            isActive
              ? sortOrder === "desc"
                ? "Đang sắp xếp giảm dần"
                : "Đang sắp xếp tăng dần"
              : `Sắp xếp theo ${label}`
          }
        >
          {label}
          <span
            className={`p-1 rounded transition-colors ${
              isActive ? "bg-blue-50" : "bg-gray-100 group-hover:bg-gray-200"
            }`}
          >
            {isActive ? (
              sortOrder === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
              )
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" />
            )}
          </span>
        </button>
      </th>
    );
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);

  const deviceSelectOptions = [
    { value: "all", label: "Tất cả thiết bị" },
    ...deviceOptions.map((device) => ({
      value: device.name,
      label: device.name,
    })),
  ];

  const actionSelectOptions = [
    { value: "all", label: "Tất cả hành động" },
    { value: "ON", label: "Bật" },
    { value: "OFF", label: "Tắt" },
  ];

  const statusSummary = useMemo(() => {
    return rows.reduce(
      (summary, row) => {
        const group = detectStatusGroup(row);
        if (group === "success") {
          summary.success += 1;
        } else if (group === "pending") {
          summary.pending += 1;
        } else {
          summary.failure += 1;
        }
        return summary;
      },
      {
        success: 0,
        failure: 0,
        pending: 0,
      },
    );
  }, [rows]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <SearchBar
            value={searchTerm}
            onChange={(val) => handleFilterChange(setSearchTerm, val)}
            placeholder="Tìm kiếm thiết bị hoặc thời gian..."
          />

          <div className="flex items-center gap-2">
            <FilterSelect
              value={filterDevice}
              onChange={(val) => handleFilterChange(setFilterDevice, val)}
              options={deviceSelectOptions}
            />
            <FilterSelect
              value={filterAction}
              onChange={(val) => handleFilterChange(setFilterAction, val)}
              options={actionSelectOptions}
            />
          </div>

          <PageSizeInput
            pageSize={pageSize}
            onChange={(val) => handleFilterChange(setPageSize, val)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleFilterChange(setFilterStatusGroup, "all");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatusGroup === "all"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-600 border border-transparent"
            }`}
          >
            <span>{pagination.totalRecords}</span>
            <span>Tổng</span>
          </button>

          <button
            onClick={() => {
              handleFilterChange(setFilterStatusGroup, "success");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              filterStatusGroup === "success"
                ? "bg-green-50 border-green-500 text-green-600"
                : "bg-white border-gray-200 text-green-600 hover:border-green-300"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{statusSummary.success}</span>
          </button>

          <button
            onClick={() => {
              handleFilterChange(setFilterStatusGroup, "failure");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              filterStatusGroup === "failure"
                ? "bg-red-50 border-red-500 text-red-600"
                : "bg-white border-gray-200 text-red-500 hover:border-red-300"
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{statusSummary.failure}</span>
          </button>

          <button
            onClick={() => {
              handleFilterChange(setFilterStatusGroup, "pending");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              filterStatusGroup === "pending"
                ? "bg-amber-50 border-amber-500 text-amber-700"
                : "bg-white border-gray-200 text-amber-700 hover:border-amber-300"
            }`}
          >
            <Clock3 className="w-4 h-4" />
            <span>{statusSummary.pending}</span>
          </button>
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
              {renderSortHeader("ID", "id")}
              {renderSortHeader("Thiết bị", "deviceName")}
              {renderSortHeader(
                "Hành động",
                "action",
                "text-center",
                "mx-auto",
              )}
              {renderSortHeader("Thời gian", "createdAt")}
              {renderSortHeader("Trạng thái", "status")}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Không có dữ liệu phù hợp
                </td>
              </tr>
            ) : (
              rows.map((record) => {
                const statusGroup = detectStatusGroup(record);
                const statusUI = getStatusUI(statusGroup);
                const StatusIcon = statusUI.icon;

                return (
                  <tr
                    key={record.id}
                    className="bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-600">
                      #{record.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {record?.deviceInfo?.name || "--"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold border ${
                          String(record.action || "").toUpperCase() === "ON"
                            ? "text-green-600 border-green-200 bg-green-50/50"
                            : "text-gray-600 border-gray-200 bg-gray-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            String(record.action || "").toUpperCase() === "ON"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        {toActionLabel(record.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDateTime(record.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusUI.dotClass}`}
                        ></span>
                        <StatusIcon
                          className={`w-4 h-4 ${statusUI.textClass}`}
                        />
                        <span className={`font-bold ${statusUI.textClass}`}>
                          {statusUI.label}
                        </span>
                      </div>
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
