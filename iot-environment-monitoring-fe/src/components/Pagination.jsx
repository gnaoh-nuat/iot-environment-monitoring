import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  pageSize,
  totalRecords,
  totalPages,
  onPageChange,
}) {
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const pageButtons = useMemo(() => {
    const total = Math.max(1, totalPages);
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = currentPage - 2;
    let end = currentPage + 2;

    if (start < 1) {
      start = 1;
      end = 5;
    }
    if (end > total) {
      end = total;
      start = total - 4;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const displayStart = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const displayEnd =
    totalRecords > 0 ? Math.min(currentPage * pageSize, totalRecords) : 0;

  const handleJump = () => {
    const page = parseInt(inputPage, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setInputPage(currentPage);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleJump();
    }
  };

  return (
    <div className="p-4 sm:px-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 rounded-b-xl">
      {/* 1. TEXT HIỂN THỊ RÕ RÀNG HƠN */}
      <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
        Hiển thị{" "}
        <span className="text-gray-900 font-semibold">{displayStart}</span> đến{" "}
        <span className="text-gray-900 font-semibold">{displayEnd}</span> trong{" "}
        <span className="text-gray-900 font-semibold">{totalRecords}</span> bản
        ghi
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* 2. GỘP NHÓM NÚT BẤM VÀO 1 KHỐI */}
        <div className="flex items-center p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>

          <div className="flex items-center px-1">
            {pageButtons.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] h-8 mx-0.5 px-2 rounded-md flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                  currentPage === pageNum
                    ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20" // Style Active thanh lịch
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all focus:outline-none"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* 3. Ô NHẬP SỐ TRANG (ĐÃ ẨN MŨI TÊN NUMBER) */}
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium hidden sm:flex">
          <span>Đến trang</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleJump}
            className="w-12 h-9 text-center font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
}
