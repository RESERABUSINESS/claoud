"use client";

interface DataPoint {
  label: string;
  sent: number;
  converted: number;
}

interface PerformanceChartProps {
  data: DataPoint[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => [d.sent, d.converted]));

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-white">أداء السيناريوهات</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
            <span className="text-xs text-gray-500">مرسلة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
            <span className="text-xs text-gray-500">تحويلات</span>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 w-full">
              <span className="text-[10px] text-gray-600 w-8 text-left">
                {Math.round(maxValue - (maxValue / 4) * i)}
              </span>
              <div className="flex-1 border-t border-gray-800/50"></div>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-3 h-52 pt-4 pr-10 relative z-10">
          {data.map((point) => (
            <div key={point.label} className="flex-1 flex items-end gap-1 group">
              {/* Sent bar */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500/80 to-cyan-400/40 rounded-t-md transition-all duration-500 hover:from-cyan-500 hover:to-cyan-400/60 min-h-[4px]"
                  style={{ height: `${(point.sent / maxValue) * 100}%` }}
                />
              </div>
              {/* Converted bar */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500/80 to-emerald-400/40 rounded-t-md transition-all duration-500 hover:from-emerald-500 hover:to-emerald-400/60 min-h-[4px]"
                  style={{ height: `${(point.converted / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-3 pr-10 mt-2">
          {data.map((point) => (
            <div key={point.label} className="flex-1 text-center">
              <span className="text-[10px] text-gray-600">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
