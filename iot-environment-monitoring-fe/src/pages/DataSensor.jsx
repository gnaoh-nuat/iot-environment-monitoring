import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

// Mock data generation
const generateMockData = () => {
  const sensors = ["Nhiệt độ", "Độ ẩm", "Ánh sáng"];
  const data = [];

  for (let i = 1; i <= 50; i++) {
    // Tạo ngày lùi dần từ hiện tại
    const date = new Date(2026, 0, 28, 6, 16, 28); // Lấy mốc thời gian giống trong ảnh
    date.setMinutes(date.getMinutes() - i * 15);

    const sensorType = sensors[i % 3];
    let value = "";

    if (sensorType === "Nhiệt độ")
      value = `${(25 + Math.random() * 5).toFixed(1)}°C`;
    else if (sensorType === "Độ ẩm")
      value = `${Math.round(60 + Math.random() * 20)}%`;
    else value = `${Math.round(400 + Math.random() * 100)} Lux`;

    // Format ngày giờ: HH:mm:ss DD/MM/YYYY
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

    data.push({
      id: 51 - i, // Đảo ID từ 50 xuống 1 giống ảnh
      sensorName: sensorType,
      value: value,
      timestamp: formattedTime,
      date: date,
    });
  }

  return data;
};

export default function DataSensor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSensor, setFilterSensor] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allData = useMemo(() => generateMockData(), []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = allData;

    // Lọc theo loại cảm biến
    if (filterSensor !== "all") {
      filtered = filtered.filter((item) => item.sensorName === filterSensor);
    }

    // Lọc theo text search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.value.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Sắp xếp
    filtered = [...filtered].sort((a, b) =>
      sortOrder === "asc" ? a.id - b.id : b.id - a.id,
    );

    return filtered;
  }, [allData, filterSensor, searchTerm, sortOrder]);

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

  return (
    // Bọc ngoài bằng h-full và flex-col để tận dụng layout có sẵn, không sinh cuộn ngoài
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 1. Header & Filters (Phần trên cùng) */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cảm biến hoặc thời gian..."
            value={searchTerm}
            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-3">
          {/* Option Cảm biến */}
          <div className="relative">
            <select
              value={filterSensor}
              onChange={(e) =>
                handleFilterChange(setFilterSensor, e.target.value)
              }
              className="appearance-none pl-4 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500 cursor-pointer font-medium text-gray-700"
            >
              <option value="all">Loại Cảm Biến</option>
              <option value="Nhiệt độ">Nhiệt độ</option>
              <option value="Độ ẩm">Độ ẩm</option>
              <option value="Ánh sáng">Ánh sáng</option>
            </select>
          </div>

          {/* Option Thời gian */}
          <div className="relative flex items-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 px-3 py-2 cursor-pointer transition-all">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Thời gian</span>
          </div>

          {/* Nút Sort */}
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
      </div>

      {/* 2. Data Table (Vùng này cuộn được nếu dữ liệu dài) */}
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
            {paginatedData.map((record) => (
              <tr
                key={record.id}
                className="bg-white hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-600">
                  #{record.id}
                </td>
                <td className="px-6 py-4">
                  {/* Badge Cảm biến thiết kế giống hệt ảnh */}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                      record.sensorName === "Nhiệt độ"
                        ? "text-red-500 border-red-200"
                        : record.sensorName === "Độ ẩm"
                          ? "text-blue-500 border-blue-200"
                          : "text-amber-500 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        record.sensorName === "Nhiệt độ"
                          ? "bg-red-500"
                          : record.sensorName === "Độ ẩm"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      }`}
                    ></span>
                    {record.sensorName}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-800">
                  {record.value}
                </td>
                <td className="px-6 py-4 text-gray-500">{record.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination (Phần dưới cùng) */}
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
            // Logic hiển thị tối đa 5 trang
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
