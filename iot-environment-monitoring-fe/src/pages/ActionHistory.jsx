import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
} from "lucide-react";

// Mock data generation
const generateMockData = () => {
  const devices = [
    "Quạt thông gió",
    "Đèn LED",
    "Máy bơm nước",
    "Cảm biến nhiệt độ",
    "Cảm biến độ ẩm",
  ];
  const data = [];

  for (let i = 1; i <= 45; i++) {
    // Tạo ngày lùi dần (giả lập giống ngày trong ảnh)
    const date = new Date(2026, 0, 28, 4, 31, 56);
    date.setMinutes(date.getMinutes() - i * 20);

    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")} ${date
      .getDate()
      .toString()
      .padStart(
        2,
        "0",
      )}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;

    // Cố tình làm lỗi một vài dòng để giống ảnh (ví dụ ID 37 thất bại)
    const isFail = i === 9 || Math.random() > 0.9;

    data.push({
      id: 46 - i, // ID giảm dần từ 45 -> 1
      deviceName: devices[Math.floor(Math.random() * devices.length)],
      action: Math.random() > 0.5 ? "Bật" : "Tắt",
      timestamp: formattedTime,
      status: isFail ? "Thất bại" : "Thành công",
      date: date,
    });
  }

  return data;
};

export default function ActionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDevice, setFilterDevice] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allData = useMemo(() => generateMockData(), []);

  const uniqueDevices = useMemo(() => {
    return Array.from(new Set(allData.map((item) => item.deviceName))).sort();
  }, [allData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = allData;

    if (filterDevice !== "all") {
      filtered = filtered.filter((item) => item.deviceName === filterDevice);
    }
    if (filterAction !== "all") {
      filtered = filtered.filter((item) => item.action === filterAction);
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.timestamp.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    filtered = [...filtered].sort((a, b) =>
      sortOrder === "asc" ? a.id - b.id : b.id - a.id,
    );
    return filtered;
  }, [
    allData,
    filterDevice,
    filterAction,
    filterStatus,
    searchTerm,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  // Stats
  const successCount = allData.filter(
    (item) => item.status === "Thành công",
  ).length;
  const failureCount = allData.filter(
    (item) => item.status === "Thất bại",
  ).length;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 1. Header & Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        {/* Nhóm Filter bên trái */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị hoặc thời gian..."
              value={searchTerm}
              onChange={(e) =>
                handleFilterChange(setSearchTerm, e.target.value)
              }
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Thiết bị & Hành động Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center border border-gray-200 rounded-lg bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-all">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={filterDevice}
                onChange={(e) =>
                  handleFilterChange(setFilterDevice, e.target.value)
                }
                className="appearance-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer pr-4"
              >
                <option value="all">Option 1 (Thiết bị)</option>
                {uniqueDevices.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filterAction}
                onChange={(e) =>
                  handleFilterChange(setFilterAction, e.target.value)
                }
                className="appearance-none pl-4 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none font-medium text-gray-700 cursor-pointer"
              >
                <option value="all">Option 1 (Hành động)</option>
                <option value="Bật">Bật</option>
                <option value="Tắt">Tắt</option>
              </select>
            </div>
          </div>

          {/* Thời gian Filter */}
          <div className="relative flex items-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 px-3 py-2 cursor-pointer transition-all">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 pr-4">
              Option 1 (Thời gian)
            </span>
          </div>

          {/* Sort */}
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all text-gray-700"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "desc" ? "Mới nhất" : "Cũ nhất"}
          </button>
        </div>

        {/* Nhóm Stats Bar bên phải (Giống hệt ảnh) */}
        <div className="flex items-center gap-2">
          {/* Nút Tổng */}
          <button
            onClick={() => {
              setFilterStatus("all");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-600 border border-transparent"
            }`}
          >
            <span>{allData.length}</span>
            <span>Tổng</span>
          </button>

          {/* Nút Thành công */}
          <button
            onClick={() => {
              setFilterStatus("Thành công");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              filterStatus === "Thành công"
                ? "bg-green-50 border-green-500 text-green-600"
                : "bg-white border-gray-200 text-green-600 hover:border-green-300"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{successCount}</span>
          </button>

          {/* Nút Thất bại */}
          <button
            onClick={() => {
              setFilterStatus("Thất bại");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              filterStatus === "Thất bại"
                ? "bg-red-50 border-red-500 text-red-600"
                : "bg-white border-gray-200 text-red-500 hover:border-red-300"
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{failureCount}</span>
          </button>
        </div>
      </div>

      {/* 2. Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-semibold">ID</th>
              <th className="px-6 py-4 font-semibold">Thiết bị</th>
              <th className="px-6 py-4 font-semibold text-center">Hành động</th>
              <th className="px-6 py-4 font-semibold">Thời gian</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((record) => (
              <tr
                key={record.id}
                className="bg-white hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-600">
                  #{record.id}
                </td>
                <td className="px-6 py-4 font-bold text-gray-800">
                  {record.deviceName}
                </td>
                <td className="px-6 py-4 text-center">
                  {/* Badge Hành động */}
                  <span
                    className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold border ${
                      record.action === "Bật"
                        ? "text-green-600 border-green-200 bg-green-50/50"
                        : "text-gray-600 border-gray-200 bg-gray-100"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        record.action === "Bật" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                    {record.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{record.timestamp}</td>
                <td className="px-6 py-4">
                  {/* Trạng thái */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${record.status === "Thành công" ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    {record.status === "Thành công" ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-700">
                          Thành công
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-bold text-red-600">Thất bại</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
        <div className="font-medium text-gray-600">
          <span className="text-gray-900">
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredData.length)}
          </span>
          / {filteredData.length}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2)
              pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;

            return (
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
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
