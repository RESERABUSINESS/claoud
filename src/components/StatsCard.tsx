interface StatsCardProps {
  title: string;
  value: string;
  change: number; // نسبة التغيير
  icon: React.ReactNode;
  color: "emerald" | "cyan" | "violet" | "amber";
}

const colorMap = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/5",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/5",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-400",
    glow: "shadow-violet-500/5",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    glow: "shadow-amber-500/5",
  },
};

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  const colors = colorMap[color];
  const isPositive = change >= 0;

  return (
    <div className={`bg-[#111827] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all duration-300 shadow-lg ${colors.glow}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-center`}>
          <span className={colors.text}>{icon}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}
