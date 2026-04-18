import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  pageSize,
  totalRecords,
  totalPages,
  onPageChange,
}) {
  // Logic tạo danh sách nút phân trang (Luôn hiển thị tối đa 5 nút)
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

  // Logic tính dòng bắt đầu và kết thúc hiển thị cho chính xác
  const displayStart = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const displayEnd =
    totalRecords > 0 ? Math.min(currentPage * pageSize, totalRecords) : 0;

  return (
    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
      <div className="font-medium text-gray-600">
        <span className="text-gray-900">
          {displayStart}-{displayEnd}
        </span>
        {" / "}
        {totalRecords}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded-md border border-transparent hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:border-gray-900 focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {pageButtons.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 rounded-md flex items-center justify-center font-medium transition-colors ${
              currentPage === pageNum
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-md border border-transparent hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:border-gray-900 focus:outline-none"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
