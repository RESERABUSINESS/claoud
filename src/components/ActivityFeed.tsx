interface Activity {
  id: string;
  message: string;
  time: string;
  type: "sent" | "converted" | "opened" | "coupon";
}

const typeConfig = {
  sent: { color: "bg-cyan-400", label: "إرسال" },
  converted: { color: "bg-emerald-400", label: "تحويل" },
  opened: { color: "bg-violet-400", label: "فتح" },
  coupon: { color: "bg-amber-400", label: "كوبون" },
};

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white">آخر النشاطات</h3>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </div>
        <span className="text-xs text-gray-500">مباشر</span>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pl-2">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-gray-800/50 hover:border-gray-700/50 transition-colors"
            >
              <div className={`w-2 h-2 ${config.color} rounded-full mt-2 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 leading-relaxed">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-gray-600">{activity.time}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color}/10 text-gray-500`}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
