export default function PageSizeInput({ pageSize, onChange }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
      <span className="text-sm font-medium text-slate-500">Hiển thị</span>
      <input
        type="number"
        min={1}
        value={pageSize}
        onChange={(e) => {
          const parsedSize = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(parsedSize) && parsedSize > 0) {
            onChange(parsedSize);
          }
        }}
        className="w-8 text-sm font-bold text-slate-700 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-sm font-medium text-slate-500">/ trang</span>
    </div>
  );
}
