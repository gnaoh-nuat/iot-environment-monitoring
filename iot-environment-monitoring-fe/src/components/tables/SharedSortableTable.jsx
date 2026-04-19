import { ArrowDown, ArrowUp, Loader2, SearchX } from "lucide-react";

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSortToggle,
  thClassName = "",
  buttonClassName = "",
}) {
  const isActive = sortBy === columnKey;

  return (
    <th className={`px-6 py-4 font-semibold ${thClassName}`}>
      <button
        type="button"
        onClick={() => onSortToggle(columnKey)}
        className={`group flex items-center gap-1.5 font-semibold transition-all duration-200 focus:outline-none ${
          isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
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
          className={`p-1 rounded-md transition-colors duration-200 ${
            isActive
              ? "bg-blue-50/80"
              : "bg-transparent group-hover:bg-slate-100"
          }`}
        >
          {isActive ? (
            sortOrder === "asc" ? (
              <ArrowUp
                className="w-3.5 h-3.5 text-blue-600"
                strokeWidth={2.5}
              />
            ) : (
              <ArrowDown
                className="w-3.5 h-3.5 text-blue-600"
                strokeWidth={2.5}
              />
            )
          ) : (
            <ArrowDown
              className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              strokeWidth={2.5}
            />
          )}
        </span>
      </button>
    </th>
  );
}

export default function SharedSortableTable({
  columns,
  rows,
  loading,
  sortBy,
  sortOrder,
  onSortToggle,
  renderRow,
  loadingMessage = "Đang tải dữ liệu...",
  emptyMessage = "Không tìm thấy dữ liệu phù hợp",
}) {
  const columnCount = columns.length;

  return (
    <div className="flex-1 overflow-auto relative">
      <table className="w-full text-sm text-left border-collapse">
        {/* Sticky Header với hiệu ứng Kính mờ (Glassmorphism) */}
        <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-slate-200">
          <tr>
            {columns.map((column) => {
              if (column.sortable === false) {
                return (
                  <th
                    key={column.columnKey}
                    className={`px-6 py-4 font-semibold ${column.thClassName || ""}`}
                  >
                    {column.label}
                  </th>
                );
              }

              return (
                <SortableHeader
                  key={column.columnKey}
                  label={column.label}
                  columnKey={column.columnKey}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortToggle={onSortToggle}
                  thClassName={column.thClassName}
                  buttonClassName={column.buttonClassName}
                />
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columnCount} className="px-6 py-16">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="font-medium text-sm">{loadingMessage}</span>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-6 py-16">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-1 border border-slate-100">
                    <SearchX className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="font-medium text-sm text-slate-500">
                    {emptyMessage}
                  </span>
                  <span className="text-xs text-slate-400">
                    Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
}
