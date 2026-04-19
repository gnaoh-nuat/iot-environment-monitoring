import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function FilterSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Xử lý sự kiện click ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lấy ra label của option đang được chọn để hiển thị lên nút
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. NÚT TRIGGER (Thay thế cho ô select gốc) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between min-w-[160px] w-full pl-4 pr-3 py-2.5 text-sm font-medium bg-white border rounded-xl shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
          isOpen
            ? "border-blue-500 text-blue-600"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        <span className="truncate pr-2">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-blue-500" : "text-slate-400"
          }`}
        />
      </button>

      {/* 2. MENU DROPDOWN TÙY CHỈNH */}
      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-2 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-1.5 origin-top animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false); // Đóng menu sau khi chọn
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-blue-50/50 text-blue-600 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
              >
                <span className="truncate">{opt.label}</span>

                {/* Hiện icon dấu tích nếu mục này đang được chọn */}
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
