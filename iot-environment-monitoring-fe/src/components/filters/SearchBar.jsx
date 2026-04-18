import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
}) {
  return (
    <div className="relative flex-1 min-w-[240px] max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
      />
    </div>
  );
}
