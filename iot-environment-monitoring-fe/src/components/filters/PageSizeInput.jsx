export default function PageSizeInput({ pageSize, onChange }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
      <span className="text-sm text-gray-600">/trang</span>
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
        className="w-16 text-sm font-medium text-gray-700 focus:outline-none"
      />
    </div>
  );
}
