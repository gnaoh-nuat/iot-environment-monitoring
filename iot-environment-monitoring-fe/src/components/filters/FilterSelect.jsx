export default function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-4 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none font-medium text-gray-700 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
