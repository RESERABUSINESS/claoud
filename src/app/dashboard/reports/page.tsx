"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// =============================================
// أنواع البيانات
// =============================================

type TimePeriod = "today" | "yesterday" | "7days" | "30days" | "custom";
type ScenarioFilter = "all" | "abandoned_cart" | "dormant" | "welcome" | "vip" | "birthday";
type SortField = "date" | "customer" | "scenario" | "status" | "revenue";
type SortDir = "asc" | "desc";

interface CampaignRow {
  id: string;
  date: string;
  customer: string;
  phone: string;
  scenario: string;
  scenarioType: ScenarioFilter;
  coupon: string;
  channel: "واتساب" | "رسالة نصية" | "إيميل";
  status: "sent" | "opened" | "converted" | "expired";
  revenue: number;
}

// =============================================
// بيانات تجريبية واقعية
// =============================================

const scenarioTypeLabels: Record<ScenarioFilter, string> = {
  all: "الكل",
  abandoned_cart: "سلة متروكة",
  dormant: "عميل غايب",
  welcome: "ترحيب",
  vip: "عملاء VIP",
  birthday: "عيد ميلاد",
};

const periodLabels: Record<TimePeriod, string> = {
  today: "اليوم",
  yesterday: "أمس",
  "7days": "آخر 7 أيام",
  "30days": "آخر 30 يوم",
  custom: "مخصص",
};

// بيانات الرسم البياني الخطي - يومياً لآخر 30 يوم
const dailyData = [
  { day: "1 مارس", sent: 42, conversions: 8 },
  { day: "2 مارس", sent: 55, conversions: 12 },
  { day: "3 مارس", sent: 38, conversions: 7 },
  { day: "4 مارس", sent: 67, conversions: 15 },
  { day: "5 مارس", sent: 72, conversions: 18 },
  { day: "6 مارس", sent: 48, conversions: 11 },
  { day: "7 مارس", sent: 31, conversions: 5 },
  { day: "8 مارس", sent: 58, conversions: 14 },
  { day: "9 مارس", sent: 63, conversions: 16 },
  { day: "10 مارس", sent: 45, conversions: 9 },
  { day: "11 مارس", sent: 71, conversions: 19 },
  { day: "12 مارس", sent: 84, conversions: 22 },
  { day: "13 مارس", sent: 56, conversions: 13 },
  { day: "14 مارس", sent: 39, conversions: 6 },
  { day: "15 مارس", sent: 77, conversions: 20 },
  { day: "16 مارس", sent: 82, conversions: 21 },
  { day: "17 مارس", sent: 61, conversions: 15 },
  { day: "18 مارس", sent: 93, conversions: 25 },
  { day: "19 مارس", sent: 88, conversions: 23 },
  { day: "20 مارس", sent: 54, conversions: 12 },
  { day: "21 مارس", sent: 36, conversions: 7 },
  { day: "22 مارس", sent: 79, conversions: 18 },
  { day: "23 مارس", sent: 95, conversions: 27 },
  { day: "24 مارس", sent: 68, conversions: 16 },
  { day: "25 مارس", sent: 102, conversions: 29 },
  { day: "26 مارس", sent: 91, conversions: 24 },
  { day: "27 مارس", sent: 73, conversions: 17 },
  { day: "28 مارس", sent: 44, conversions: 9 },
  { day: "29 مارس", sent: 86, conversions: 22 },
  { day: "30 مارس", sent: 110, conversions: 31 },
];

// بيانات الرسم الدائري - توزيع الإيرادات
const revenueByScenario = [
  { name: "سلة متروكة", value: 45200, color: "#10b981" },
  { name: "عميل غايب", value: 32800, color: "#06b6d4" },
  { name: "ترحيب", value: 18900, color: "#8b5cf6" },
  { name: "عملاء VIP", value: 28400, color: "#f59e0b" },
  { name: "عيد ميلاد", value: 9700, color: "#ec4899" },
];

// أفضل 10 كوبونات أداءً
const topCoupons = [
  { code: "CART15-X8K2", uses: 89, revenue: 12400 },
  { code: "VIP-GOLD50", uses: 45, revenue: 11200 },
  { code: "DORMANT20-M3", uses: 67, revenue: 9800 },
  { code: "WELCOME10-P7", uses: 134, revenue: 8900 },
  { code: "CART15-Y2N9", uses: 72, revenue: 8200 },
  { code: "BDAY25-7X2K", uses: 47, revenue: 7600 },
  { code: "VIP-FREE-SH", uses: 38, revenue: 6900 },
  { code: "DORMANT20-K1", uses: 54, revenue: 5400 },
  { code: "CART15-W4L8", uses: 61, revenue: 4800 },
  { code: "WELCOME10-R3", uses: 98, revenue: 4200 },
];

// جدول الحملات التفصيلي
const campaignsData: CampaignRow[] = [
  { id: "1", date: "2025-03-30 14:23", customer: "محمد العتيبي", phone: "0551234567", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-X8K2", channel: "واتساب", status: "converted", revenue: 340 },
  { id: "2", date: "2025-03-30 13:45", customer: "سارة الحربي", phone: "0569876543", scenario: "ترحيب", scenarioType: "welcome", coupon: "WELCOME10-P7", channel: "واتساب", status: "converted", revenue: 180 },
  { id: "3", date: "2025-03-30 12:10", customer: "فهد المالكي", phone: "0543219876", scenario: "عميل غايب", scenarioType: "dormant", coupon: "DORMANT20-M3", channel: "واتساب", status: "opened", revenue: 0 },
  { id: "4", date: "2025-03-30 11:30", customer: "نورة القحطاني", phone: "0587654321", scenario: "عيد ميلاد", scenarioType: "birthday", coupon: "BDAY25-7X2K", channel: "واتساب", status: "converted", revenue: 520 },
  { id: "5", date: "2025-03-30 10:55", customer: "عبدالله الشهري", phone: "0501112233", scenario: "عملاء VIP", scenarioType: "vip", coupon: "VIP-GOLD50", channel: "رسالة نصية", status: "converted", revenue: 890 },
  { id: "6", date: "2025-03-30 10:20", customer: "ريم الدوسري", phone: "0534445566", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-Y2N9", channel: "واتساب", status: "sent", revenue: 0 },
  { id: "7", date: "2025-03-30 09:45", customer: "خالد السبيعي", phone: "0567778899", scenario: "ترحيب", scenarioType: "welcome", coupon: "WELCOME10-R3", channel: "واتساب", status: "opened", revenue: 0 },
  { id: "8", date: "2025-03-30 09:10", customer: "هند الزهراني", phone: "0559990011", scenario: "عميل غايب", scenarioType: "dormant", coupon: "DORMANT20-K1", channel: "واتساب", status: "expired", revenue: 0 },
  { id: "9", date: "2025-03-29 22:30", customer: "ياسر الغامدي", phone: "0522334455", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-W4L8", channel: "واتساب", status: "converted", revenue: 275 },
  { id: "10", date: "2025-03-29 21:15", customer: "مها العنزي", phone: "0578889900", scenario: "عملاء VIP", scenarioType: "vip", coupon: "VIP-FREE-SH", channel: "رسالة نصية", status: "converted", revenue: 1200 },
  { id: "11", date: "2025-03-29 20:40", customer: "تركي الحارثي", phone: "0544556677", scenario: "عميل غايب", scenarioType: "dormant", coupon: "DORMANT20-M3", channel: "إيميل", status: "opened", revenue: 0 },
  { id: "12", date: "2025-03-29 19:55", customer: "لمياء الشمري", phone: "0531122334", scenario: "ترحيب", scenarioType: "welcome", coupon: "WELCOME10-P7", channel: "واتساب", status: "converted", revenue: 145 },
  { id: "13", date: "2025-03-29 18:20", customer: "بندر الرشيدي", phone: "0566778899", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-X8K2", channel: "واتساب", status: "sent", revenue: 0 },
  { id: "14", date: "2025-03-29 17:10", customer: "أميرة الخالدي", phone: "0599001122", scenario: "عيد ميلاد", scenarioType: "birthday", coupon: "BDAY25-7X2K", channel: "واتساب", status: "converted", revenue: 310 },
  { id: "15", date: "2025-03-29 16:05", customer: "راشد العمري", phone: "0512345678", scenario: "عملاء VIP", scenarioType: "vip", coupon: "VIP-GOLD50", channel: "رسالة نصية", status: "opened", revenue: 0 },
  { id: "16", date: "2025-03-29 14:30", customer: "غادة السويلم", phone: "0543210987", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-Y2N9", channel: "واتساب", status: "converted", revenue: 460 },
  { id: "17", date: "2025-03-29 13:20", customer: "عمر القرني", phone: "0576543210", scenario: "عميل غايب", scenarioType: "dormant", coupon: "DORMANT20-K1", channel: "واتساب", status: "converted", revenue: 380 },
  { id: "18", date: "2025-03-29 12:00", customer: "وفاء البقمي", phone: "0509876543", scenario: "ترحيب", scenarioType: "welcome", coupon: "WELCOME10-R3", channel: "إيميل", status: "sent", revenue: 0 },
  { id: "19", date: "2025-03-28 23:45", customer: "سعود المطيري", phone: "0538765432", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-X8K2", channel: "واتساب", status: "converted", revenue: 195 },
  { id: "20", date: "2025-03-28 22:30", customer: "دلال الحربي", phone: "0561234567", scenario: "عملاء VIP", scenarioType: "vip", coupon: "VIP-FREE-SH", channel: "واتساب", status: "converted", revenue: 750 },
  { id: "21", date: "2025-03-28 21:10", customer: "ماجد الأحمدي", phone: "0554321098", scenario: "عميل غايب", scenarioType: "dormant", coupon: "DORMANT20-M3", channel: "واتساب", status: "expired", revenue: 0 },
  { id: "22", date: "2025-03-28 19:45", customer: "عهود العسيري", phone: "0589012345", scenario: "عيد ميلاد", scenarioType: "birthday", coupon: "BDAY25-7X2K", channel: "واتساب", status: "sent", revenue: 0 },
  { id: "23", date: "2025-03-28 18:20", customer: "نايف الزهراني", phone: "0517890123", scenario: "ترحيب", scenarioType: "welcome", coupon: "WELCOME10-P7", channel: "واتساب", status: "converted", revenue: 220 },
  { id: "24", date: "2025-03-28 16:55", customer: "حصة الدوسري", phone: "0546789012", scenario: "سلة متروكة", scenarioType: "abandoned_cart", coupon: "CART15-W4L8", channel: "واتساب", status: "opened", revenue: 0 },
  { id: "25", date: "2025-03-28 15:30", customer: "فيصل المالكي", phone: "0573456789", scenario: "عملاء VIP", scenarioType: "vip", coupon: "VIP-GOLD50", channel: "رسالة نصية", status: "converted", revenue: 980 },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  sent: { label: "مرسل", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  opened: { label: "مفتوح", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  converted: { label: "محوّل", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  expired: { label: "منتهي", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
};

// =============================================
// Tooltip مخصص للرسوم البيانية
// =============================================

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1A2235] border border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString("ar-SA")}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0];
  return (
    <div className="bg-[#1A2235] border border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-sm font-medium text-white">{data.name}</p>
      <p className="text-sm mt-1" style={{ color: data.payload.color }}>
        {data.value.toLocaleString("ar-SA")} ر.س
      </p>
    </div>
  );
}

// =============================================
// صفحة التقارير
// =============================================

export default function ReportsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30days");
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // تصفية البيانات حسب نوع السيناريو
  const filteredCampaigns = useMemo(() => {
    let data = [...campaignsData];
    if (scenarioFilter !== "all") {
      data = data.filter((c) => c.scenarioType === scenarioFilter);
    }
    // الفرز
    data.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "date": return dir * a.date.localeCompare(b.date);
        case "customer": return dir * a.customer.localeCompare(b.customer);
        case "scenario": return dir * a.scenario.localeCompare(b.scenario);
        case "status": return dir * a.status.localeCompare(b.status);
        case "revenue": return dir * (a.revenue - b.revenue);
        default: return 0;
      }
    });
    return data;
  }, [scenarioFilter, sortField, sortDir]);

  // حساب ملخص الإحصائيات
  const summary = useMemo(() => {
    const total = filteredCampaigns.length;
    const opened = filteredCampaigns.filter((c) => c.status === "opened" || c.status === "converted").length;
    const converted = filteredCampaigns.filter((c) => c.status === "converted").length;
    const revenue = filteredCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const cost = total * 0.5; // متوسط تكلفة الرسالة 0.50 ر.س
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

    return {
      totalSent: total,
      openRate: total > 0 ? ((opened / total) * 100).toFixed(1) : "0",
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0",
      revenue,
      roi: roi.toFixed(0),
    };
  }, [filteredCampaigns]);

  // الفرز عند الضغط على رأس العمود
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  // تصدير CSV
  const exportCSV = () => {
    const headers = ["التاريخ", "العميل", "الجوال", "السيناريو", "الكوبون", "القناة", "الحالة", "الإيراد"];
    const rows = filteredCampaigns.map((c) => [
      c.date,
      c.customer,
      c.phone,
      c.scenario,
      c.coupon,
      c.channel,
      statusLabels[c.status].label,
      c.revenue.toString(),
    ]);

    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart-offers-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // بيانات الرسم البياني الخطي حسب الفترة
  const lineChartData = useMemo(() => {
    if (period === "7days") return dailyData.slice(-7);
    if (period === "today") return dailyData.slice(-1);
    if (period === "yesterday") return dailyData.slice(-2, -1);
    return dailyData;
  }, [period]);

  return (
    <DashboardLayout>
      {/* العنوان */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">التقارير والتحليلات</h1>
          <p className="text-sm text-gray-500 mt-1">تحليل أداء العروض والحملات التسويقية</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          تصدير CSV
        </button>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* فلتر الفترة الزمنية */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-1 flex gap-1">
          {(Object.entries(periodLabels) as [TimePeriod, string][])
            .filter(([key]) => key !== "custom")
            .map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === key
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
        </div>

        {/* فلتر نوع السيناريو */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-1 flex gap-1 flex-wrap">
          {(Object.entries(scenarioTypeLabels) as [ScenarioFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setScenarioFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                scenarioFilter === key
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          title="إجمالي العروض المرسلة"
          value={summary.totalSent.toLocaleString("ar-SA")}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
          color="emerald"
        />
        <SummaryCard
          title="معدل الفتح"
          value={`${summary.openRate}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          color="cyan"
        />
        <SummaryCard
          title="معدل التحويل"
          value={`${summary.conversionRate}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="violet"
        />
        <SummaryCard
          title="الإيرادات الإضافية"
          value={`${summary.revenue.toLocaleString("ar-SA")} ر.س`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
        <SummaryCard
          title="ROI العائد على الاستثمار"
          value={`${Number(summary.roi).toLocaleString("ar-SA")}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="emerald"
        />
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* خط بياني: العروض المرسلة vs التحويلات */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-1">العروض المرسلة vs التحويلات</h3>
          <p className="text-xs text-gray-500 mb-4">الأداء اليومي خلال الفترة المحددة</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "#374151" }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "#374151" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => <span className="text-xs text-gray-400">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="sent"
                  name="العروض المرسلة"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 3 }}
                  activeDot={{ r: 5, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  name="التحويلات"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ fill: "#06b6d4", r: 3 }}
                  activeDot={{ r: 5, fill: "#06b6d4" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* دائري: توزيع الإيرادات */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-base font-bold text-white mb-1">توزيع الإيرادات حسب السيناريو</h3>
          <p className="text-xs text-gray-500 mb-4">إجمالي {revenueByScenario.reduce((s, r) => s + r.value, 0).toLocaleString("ar-SA")} ر.س</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByScenario}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {revenueByScenario.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {revenueByScenario.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* أعمدة: أفضل 10 كوبونات */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-base font-bold text-white mb-1">أفضل 10 كوبونات أداءً</h3>
          <p className="text-xs text-gray-500 mb-4">حسب الإيرادات المحققة</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCoupons} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={{ stroke: "#374151" }} />
                <YAxis
                  type="category"
                  dataKey="code"
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  axisLine={{ stroke: "#374151" }}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const data = payload[0].payload as { code: string; uses: number; revenue: number };
                    return (
                      <div className="bg-[#1A2235] border border-gray-700 rounded-xl p-3 shadow-xl">
                        <p className="text-sm font-medium text-white">{data.code}</p>
                        <p className="text-xs text-emerald-400 mt-1">الإيراد: {data.revenue.toLocaleString("ar-SA")} ر.س</p>
                        <p className="text-xs text-cyan-400">الاستخدامات: {data.uses}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* جدول الحملات التفصيلي */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-base font-bold text-white">تفاصيل الحملات</h3>
            <p className="text-xs text-gray-500 mt-1">{filteredCampaigns.length} حملة</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <ThCell label="التاريخ" field="date" sortField={sortField} onSort={handleSort} sortIcon={sortIcon} />
                <ThCell label="العميل" field="customer" sortField={sortField} onSort={handleSort} sortIcon={sortIcon} />
                <ThCell label="السيناريو" field="scenario" sortField={sortField} onSort={handleSort} sortIcon={sortIcon} />
                <th className="text-right text-gray-500 font-medium px-4 py-3">الكوبون</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">القناة</th>
                <ThCell label="الحالة" field="status" sortField={sortField} onSort={handleSort} sortIcon={sortIcon} />
                <ThCell label="الإيراد" field="revenue" sortField={sortField} onSort={handleSort} sortIcon={sortIcon} />
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{campaign.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-200 font-medium">{campaign.customer}</p>
                    <p className="text-gray-500 text-xs">{campaign.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{campaign.scenario}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-800 text-cyan-400 px-2 py-0.5 rounded">{campaign.coupon}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{campaign.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusLabels[campaign.status].color}`}>
                      {statusLabels[campaign.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left font-medium">
                    {campaign.revenue > 0 ? (
                      <span className="text-emerald-400">{campaign.revenue.toLocaleString("ar-SA")} ر.س</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

// =============================================
// مكونات مساعدة
// =============================================

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "cyan" | "violet" | "amber";
}) {
  const colorMap = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center mb-3`}>
        <span className={c.text}>{icon}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );
}

function ThCell({
  label,
  field,
  sortField,
  onSort,
  sortIcon,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  onSort: (f: SortField) => void;
  sortIcon: (f: SortField) => string;
}) {
  return (
    <th
      className={`text-right font-medium px-4 py-3 cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap ${
        sortField === field ? "text-gray-300" : "text-gray-500"
      }`}
      onClick={() => onSort(field)}
    >
      {label}{" "}
      <span className="text-xs opacity-60">{sortIcon(field)}</span>
    </th>
  );
}
