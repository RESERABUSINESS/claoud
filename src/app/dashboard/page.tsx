"use client";

import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import ScenarioCard from "@/components/ScenarioCard";
import ActivityFeed from "@/components/ActivityFeed";
import PerformanceChart from "@/components/PerformanceChart";

// =============================================
// بيانات تجريبية
// =============================================

const statsData = [
  {
    title: "عروض مرسلة اليوم",
    value: "1,284",
    change: 12.5,
    color: "emerald" as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    title: "تحويلات ناجحة",
    value: "342",
    change: 8.2,
    color: "cyan" as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "إيرادات إضافية",
    value: "48,560 ر.س",
    change: 23.1,
    color: "violet" as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "معدل التحويل",
    value: "26.6%",
    change: -2.4,
    color: "amber" as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

const scenariosData = [
  {
    name: "استرجاع السلة المتروكة",
    type: "abandoned_cart",
    description: "تذكير العملاء بسلاتهم المتروكة مع خصم تحفيزي",
    icon: <span className="text-lg">🛒</span>,
    isActive: true,
    discount: "خصم 15%",
    channel: "واتساب",
    waitTime: "30 دقيقة",
    stats: { sent: 456, opened: 234, converted: 89, revenue: 12400 },
  },
  {
    name: "تنشيط العملاء الخاملين",
    type: "dormant",
    description: "إعادة جذب العملاء اللي ما طلبوا من 30 يوم",
    icon: <span className="text-lg">💤</span>,
    isActive: true,
    discount: "خصم 20%",
    channel: "واتساب",
    waitTime: "فوري",
    stats: { sent: 312, opened: 178, converted: 67, revenue: 15800 },
  },
  {
    name: "ترحيب بالعملاء الجدد",
    type: "welcome",
    description: "رسالة ترحيب مع كوبون للطلب الأول",
    icon: <span className="text-lg">👋</span>,
    isActive: true,
    discount: "خصم 10%",
    channel: "واتساب",
    waitTime: "5 دقائق",
    stats: { sent: 289, opened: 201, converted: 134, revenue: 8900 },
  },
  {
    name: "مكافأة عملاء VIP",
    type: "vip",
    description: "عروض حصرية للعملاء اللي صرفوا أكثر من 5000 ر.س",
    icon: <span className="text-lg">⭐</span>,
    isActive: false,
    discount: "شحن مجاني",
    channel: "رسالة نصية",
    waitTime: "فوري",
    stats: { sent: 87, opened: 72, converted: 45, revenue: 9200 },
  },
  {
    name: "عرض عيد الميلاد",
    type: "birthday",
    description: "خصم خاص في يوم ميلاد العميل",
    icon: <span className="text-lg">🎂</span>,
    isActive: true,
    discount: "خصم 25%",
    channel: "واتساب",
    waitTime: "صباحاً",
    stats: { sent: 140, opened: 112, converted: 47, revenue: 2260 },
  },
];

const activitiesData = [
  {
    id: "1",
    message: "تم إرسال كوبون WELCOME10 لـ محمد العتيبي — ترحيب بالعملاء الجدد",
    time: "قبل دقيقتين",
    type: "sent" as const,
  },
  {
    id: "2",
    message: "سارة الحربي استخدمت كوبون CART15 وأكملت طلب بقيمة 340 ر.س",
    time: "قبل 5 دقائق",
    type: "converted" as const,
  },
  {
    id: "3",
    message: "فهد المالكي فتح رسالة تنشيط العملاء الخاملين",
    time: "قبل 8 دقائق",
    type: "opened" as const,
  },
  {
    id: "4",
    message: "تم توليد كوبون BDAY25-7X2K لـ نورة القحطاني — عرض عيد الميلاد",
    time: "قبل 12 دقيقة",
    type: "coupon" as const,
  },
  {
    id: "5",
    message: "عبدالله الشهري استخدم كوبون VIP-FREE وأكمل طلب بقيمة 890 ر.س",
    time: "قبل 15 دقيقة",
    type: "converted" as const,
  },
  {
    id: "6",
    message: "تم إرسال تذكير سلة متروكة لـ ريم الدوسري — 3 منتجات بقيمة 567 ر.س",
    time: "قبل 22 دقيقة",
    type: "sent" as const,
  },
  {
    id: "7",
    message: "خالد السبيعي فتح رسالة ترحيب العملاء الجدد",
    time: "قبل 28 دقيقة",
    type: "opened" as const,
  },
  {
    id: "8",
    message: "تم توليد كوبون DORMANT20-9M3P لـ هند الزهراني",
    time: "قبل 35 دقيقة",
    type: "coupon" as const,
  },
];

const chartData = [
  { label: "السبت", sent: 180, converted: 45 },
  { label: "الأحد", sent: 220, converted: 58 },
  { label: "الإثنين", sent: 195, converted: 52 },
  { label: "الثلاثاء", sent: 260, converted: 71 },
  { label: "الأربعاء", sent: 240, converted: 63 },
  { label: "الخميس", sent: 310, converted: 89 },
  { label: "الجمعة", sent: 150, converted: 34 },
];

// =============================================
// صفحة لوحة التحكم
// =============================================

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* السيناريوهات النشطة */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">السيناريوهات النشطة</h3>
            <p className="text-sm text-gray-500 mt-1">إدارة سيناريوهات الأتمتة</p>
          </div>
          <button className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            + سيناريو جديد
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scenariosData.map((scenario) => (
            <ScenarioCard key={scenario.name} {...scenario} />
          ))}
        </div>
      </div>

      {/* القسم السفلي: النشاطات + الرسم البياني */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed activities={activitiesData} />
        <PerformanceChart data={chartData} />
      </div>
    </DashboardLayout>
  );
}
