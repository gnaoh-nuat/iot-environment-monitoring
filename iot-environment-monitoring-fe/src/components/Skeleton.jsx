/**
 * Skeleton Loader Component - show placeholder while loading
 */
export const Skeleton = ({
  width = "w-full",
  height = "h-4",
  className = "",
}) => {
  return (
    <div
      className={`${width} ${height} bg-slate-200 rounded animate-pulse ${className}`}
    />
  );
};

/**
 * Card Skeleton - loading state for cards
 */
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <Skeleton height="h-6" width="w-2/3" />
          <Skeleton height="h-4" width="w-full" />
          <Skeleton height="h-4" width="w-5/6" />
          <div className="flex gap-2 pt-2">
            <Skeleton height="h-8" width="w-20" className="rounded-lg" />
            <Skeleton height="h-8" width="w-20" className="rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = ({ columns = 5, count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-slate-200">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-6 py-4">
              <Skeleton height="h-4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/**
 * Chart Skeleton
 */
export const ChartSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
      <Skeleton height="h-6" width="w-2/3" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-end gap-2 h-20">
            <Skeleton
              width="w-full"
              height={`h-${Math.floor(Math.random() * 16) + 4}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
