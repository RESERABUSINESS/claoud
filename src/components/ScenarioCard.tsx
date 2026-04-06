"use client";

import { useState } from "react";

interface ScenarioStats {
  sent: number;
  opened: number;
  converted: number;
  revenue: number;
}

interface ScenarioCardProps {
  name: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  discount: string;
  channel: string;
  waitTime: string;
  stats: ScenarioStats;
}

export default function ScenarioCard({
  name,
  type,
  description,
  icon,
  isActive: initialActive,
  discount,
  channel,
  waitTime,
  stats,
}: ScenarioCardProps) {
  const [isActive, setIsActive] = useState(initialActive);

  const typeColors: Record<string, string> = {
    abandoned_cart: "from-orange-500 to-red-500",
    dormant: "from-violet-500 to-purple-500",
    welcome: "from-emerald-500 to-cyan-500",
    vip: "from-amber-500 to-yellow-500",
    birthday: "from-pink-500 to-rose-500",
  };

  const gradient = typeColors[type] || "from-gray-500 to-gray-600";

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setIsActive(!isActive)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
            isActive ? "bg-emerald-500" : "bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              isActive ? "right-0.5" : "right-[22px]"
            }`}
          />
        </button>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-gray-800 text-gray-400 px-2.5 py-1 rounded-lg">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {discount}
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-gray-800 text-gray-400 px-2.5 py-1 rounded-lg">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {channel}
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-gray-800 text-gray-400 px-2.5 py-1 rounded-lg">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {waitTime}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 bg-white/[0.02] border border-gray-800/50 rounded-xl p-3">
        <div className="text-center">
          <p className="text-sm font-bold text-white">{stats.sent}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">أُرسلت</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-cyan-400">{stats.opened}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">فُتحت</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-400">{stats.converted}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">اشتروا</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-amber-400">{stats.revenue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">إيراد (ر.س)</p>
        </div>
      </div>
    </div>
  );
}
