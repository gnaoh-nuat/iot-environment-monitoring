import { useState, useEffect } from "react";

const TIME_STEP_SECONDS = 2;

const formatTime = (date) => {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
};

const buildInitialTimeLabels = (
  pointCount,
  stepSeconds = TIME_STEP_SECONDS,
) => {
  const now = new Date();
  return Array.from({ length: pointCount }, (_, index) => {
    const d = new Date(now);
    d.setSeconds(now.getSeconds() - (pointCount - 1 - index) * stepSeconds);
    return formatTime(d);
  });
};

const ChartCard = ({
  title,
  series: initialSeries,
  badges,
  rangeMax,
  rangeMin,
  yLabels,
}) => {
  const initialPointCount = Math.max(
    2,
    ...initialSeries.map((item) => item.values.length),
  );

  // 1. Quản lý State cho dữ liệu Real-time
  const [series, setSeries] = useState(initialSeries);
  const [timeLabels, setTimeLabels] = useState(() =>
    buildInitialTimeLabels(initialPointCount),
  );

  const pointCount = Math.max(2, ...series.map((item) => item.values.length));

  // 2. Cập nhật dữ liệu mỗi 2 giây
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Format giờ: phút: giây
      const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      // Thêm mốc thời gian mới, xóa mốc cũ nhất theo số điểm hiện tại
      setTimeLabels((prev) => {
        const newLabels = [...prev, timeString];
        if (newLabels.length > pointCount) newLabels.shift();
        return newLabels;
      });

      // Tạo dữ liệu giả lập cho từng đường (line)
      setSeries((prevSeries) =>
        prevSeries.map((s) => {
          const lastValue = s.values[s.values.length - 1];
          // Độ lệch ngẫu nhiên: +/- 1 đối với nhiệt độ, +/- 5 đối với ánh sáng
          const variation = (Math.random() - 0.5) * (rangeMax > 100 ? 10 : 2);
          let newValue = lastValue + variation;

          // Giới hạn để biểu đồ không bị tràn
          if (newValue > rangeMax) newValue = rangeMax;
          if (newValue < rangeMin) newValue = rangeMin;

          const newValues = [...s.values, parseFloat(newValue.toFixed(1))];
          if (newValues.length > pointCount) newValues.shift();
          return { ...s, values: newValues };
        }),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [rangeMax, rangeMin, pointCount]);

  useEffect(() => {
    // Đồng bộ lại khi dữ liệu đầu vào thay đổi số điểm
    setSeries(initialSeries);
    setTimeLabels((prev) => {
      if (prev.length === initialPointCount) return prev;
      return buildInitialTimeLabels(initialPointCount);
    });
  }, [initialSeries, initialPointCount]);

  // 3. Cấu hình kích thước vùng vẽ SVG (Canvas)
  const width = 600;
  const height = 220;
  // Khai báo vùng an toàn để chữ không bị cắt (Padding)
  const padding = { top: 20, right: 20, bottom: 44, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxVisibleTimeLabels = 5;
  const timeLabelStep = Math.max(
    1,
    Math.ceil(timeLabels.length / maxVisibleTimeLabels),
  );

  const getX = (index, count) => {
    return padding.left + (index / Math.max(count - 1, 1)) * chartWidth;
  };

  // 4. Hàm vẽ đường thẳng cho biểu đồ
  const buildLinePath = (values) => {
    if (!values || values.length === 0) return "";
    const range = rangeMax - rangeMin || 1;

    return values
      .map((value, index) => {
        const x = getX(index, pointCount);
        const y =
          padding.top +
          chartHeight -
          ((value - rangeMin) / range) * chartHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
      {/* Header Biểu đồ */}
      <div className="flex justify-between items-start mb-6 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500">Theo dõi thời gian thực</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {/* Cập nhật nhãn Badge tự động theo giá trị mới nhất */}
          {series.map((s, idx) => (
            <span
              key={s.label}
              className={`px-3 py-1 text-sm font-semibold rounded-full ${badges[idx]?.className}`}
            >
              {s.values[s.values.length - 1]}{" "}
              {/* Lấy giá trị phần tử cuối cùng */}
            </span>
          ))}
        </div>
      </div>

      {/* Khu vực vẽ SVG */}
      <div className="flex-1 w-full relative min-h-[220px]">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* --- TRỤC Y VÀ ĐƯỜNG LƯỚI NGANG --- */}
          {yLabels.map((label, index) => {
            const y =
              padding.top +
              chartHeight -
              (index / (yLabels.length - 1)) * chartHeight;
            return (
              <g key={`y-${label}`}>
                {/* Đường lưới nét đứt */}
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                {/* Chữ nhãn trục Y (Canh lề phải) */}
                <text
                  x={padding.left - 10}
                  y={y + 4} // +4 để chữ cân bằng giữa vạch
                  textAnchor="end"
                  fontSize="12"
                  fill="#9CA3AF"
                  fontWeight="500"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Đường line gốc của trục Y */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />

          {/* --- TRỤC X VÀ ĐƯỜNG LƯỚI DỌC --- */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />

          {timeLabels.map((time, index) => {
            const x = getX(index, pointCount);
            const isLast = index === timeLabels.length - 1;
            const shouldShowLabel = index % timeLabelStep === 0 || isLast;

            return (
              <g key={`x-${index}`}>
                {/* Vạch nhỏ đánh dấu trục X */}
                <line
                  x1={x}
                  y1={padding.top + chartHeight}
                  x2={x}
                  y2={padding.top + chartHeight + 5}
                  stroke="#E5E7EB"
                  strokeWidth="1.5"
                />
                {/* Chữ nhãn trục X */}
                {shouldShowLabel ? (
                  <text
                    x={x}
                    y={padding.top + chartHeight + 24}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#9CA3AF"
                    fontWeight="500"
                    className="tabular-nums"
                  >
                    {time}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* --- VẼ ĐƯỜNG BIỂU ĐỒ (LINE PATHS) --- */}
          {series.map((s) => (
            <path
              key={s.label}
              d={buildLinePath(s.values)}
              stroke={s.color}
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round" // Làm mượt các điểm gấp khúc
              strokeLinecap="round"
              className="transition-all duration-500 ease-linear" // Thêm animation trượt mượt
            />
          ))}

          {/* Dấu chấm (Points) trên biểu đồ để dễ nhìn hơn */}
          {series.map((s) =>
            s.values.map((value, index) => {
              const x = getX(index, pointCount);
              const y =
                padding.top +
                chartHeight -
                ((value - rangeMin) / (rangeMax - rangeMin || 1)) * chartHeight;
              return (
                <circle
                  key={`point-${s.label}-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="white"
                  stroke={s.color}
                  strokeWidth="2"
                  className="transition-all duration-500 ease-linear"
                />
              );
            }),
          )}
        </svg>
      </div>

      {/* Chú thích biểu đồ (Legend) */}
      <div className="flex justify-center space-x-6 mt-2 pt-4">
        {series.map((s) => (
          <div
            key={s.label}
            className="flex items-center text-xs font-medium text-gray-500"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm mr-2 shadow-sm"
              style={{ backgroundColor: s.color }}
            ></span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartCard;
