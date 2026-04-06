"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";

// =============================================
// أنواع البيانات
// =============================================

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: "تسجيل دخول", icon: "🔑", color: "text-emerald-400" },
  logout: { label: "تسجيل خروج", icon: "🚪", color: "text-gray-400" },
  register: { label: "إنشاء حساب", icon: "👤", color: "text-cyan-400" },
  password_change: { label: "تغيير كلمة المرور", icon: "🔒", color: "text-amber-400" },
  forgot_password: { label: "طلب استعادة كلمة المرور", icon: "📧", color: "text-violet-400" },
  store_connect: { label: "ربط متجر", icon: "🏪", color: "text-emerald-400" },
  store_disconnect: { label: "فصل متجر", icon: "🔌", color: "text-red-400" },
  api_key_regenerate: { label: "تجديد مفاتيح API", icon: "🔄", color: "text-amber-400" },
};

// =============================================
// صفحة إعدادات الحساب
// =============================================

export default function AccountSettingsPage() {
  const { data: session } = useSession();

  // تغيير كلمة المرور
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // سجل النشاطات
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // جلب سجل النشاطات
  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch("/api/user/activity");
        const data = await res.json();
        if (data.success) {
          setActivities(data.data);
        }
      } catch {
        console.error("فشل جلب النشاطات");
      } finally {
        setActivitiesLoading(false);
      }
    }
    fetchActivities();
  }, []);

  // تغيير كلمة المرور
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPwdMessage({ type: "success", text: "تم تغيير كلمة المرور بنجاح" });
        setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      } else {
        setPwdMessage({ type: "error", text: data.error || "حدث خطأ" });
      }
    } catch {
      setPwdMessage({ type: "error", text: "حدث خطأ في الاتصال" });
    } finally {
      setPwdLoading(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
    if (diffHr < 24) return `قبل ${diffHr} ساعة`;
    if (diffDay < 7) return `قبل ${diffDay} يوم`;
    return date.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-1">إعدادات الحساب</h1>
        <p className="text-sm text-gray-500 mb-8">إدارة حسابك وأمان الدخول</p>

        {/* معلومات الحساب */}
        <section className="bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-base font-bold text-white mb-4">معلومات الحساب</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم</label>
              <p className="text-sm text-gray-200 font-medium">{session?.user?.name || "—"}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">البريد الإلكتروني</label>
              <p className="text-sm text-gray-200 font-medium" dir="ltr">{session?.user?.email || "—"}</p>
            </div>
          </div>
        </section>

        {/* المتاجر المربوطة */}
        <section className="bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">المتاجر المربوطة</h2>
            <a
              href="/dashboard/settings/connect"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              + ربط متجر جديد
            </a>
          </div>

          {session?.user?.stores && session.user.stores.length > 0 ? (
            <div className="space-y-3">
              {session.user.stores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between bg-[#0B1120] border border-gray-800 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-400 text-sm font-bold">
                        {store.platform === "SALLA" ? "S" : store.platform === "ZID" ? "Z" : "Sh"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{store.name}</p>
                      <p className="text-xs text-gray-500">{store.platform} — {store.role === "OWNER" ? "مالك" : store.role === "ADMIN" ? "مدير" : "مشاهد"}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">
                    متصل
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">ما عندك متاجر مربوطة</p>
              <a
                href="/dashboard/settings/connect"
                className="inline-block mt-2 text-xs text-emerald-400 hover:text-emerald-300"
              >
                اربط متجرك الأول
              </a>
            </div>
          )}
        </section>

        {/* تغيير كلمة المرور */}
        <section className="bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-base font-bold text-white mb-4">تغيير كلمة المرور</h2>

          {pwdMessage && (
            <div className={`rounded-xl px-4 py-3 text-sm mb-4 border ${
              pwdMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {pwdMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">كلمة المرور الحالية</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                dir="ltr"
                className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="8 أحرف + حرف كبير + رقم"
                  required
                  dir="ltr"
                  className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={passwords.confirmNewPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                  required
                  dir="ltr"
                  className={`w-full bg-[#0B1120] border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-1 outline-none transition-colors text-sm ${
                    passwords.confirmNewPassword && passwords.confirmNewPassword !== passwords.newPassword
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                  }`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={pwdLoading}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {pwdLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </button>
          </form>
        </section>

        {/* سجل النشاطات */}
        <section className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-base font-bold text-white mb-4">سجل النشاطات</h2>

          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-700 rounded w-40 mb-1" />
                    <div className="h-2.5 bg-gray-800 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity) => {
                const meta = actionLabels[activity.action] || {
                  label: activity.action,
                  icon: "📋",
                  color: "text-gray-400",
                };
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 bg-[#0B1120] border border-gray-800/50 rounded-xl p-3"
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{formatDate(activity.createdAt)}</span>
                        {activity.ipAddress && (
                          <>
                            <span>·</span>
                            <span dir="ltr">{activity.ipAddress}</span>
                          </>
                        )}
                      </div>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">لا توجد نشاطات مسجّلة</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
