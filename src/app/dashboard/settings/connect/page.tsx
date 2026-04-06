"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

const platforms = [
  {
    id: "salla",
    name: "سلة",
    nameEn: "Salla",
    description: "اربط متجرك على منصة سلة لتفعيل العروض الذكية تلقائياً",
    logo: "🟣",
    gradient: "from-purple-600 to-indigo-600",
    available: true,
  },
  {
    id: "zid",
    name: "زد",
    nameEn: "Zid",
    description: "اربط متجرك على منصة زد — قريباً",
    logo: "🔵",
    gradient: "from-blue-600 to-cyan-600",
    available: false,
  },
  {
    id: "shopify",
    name: "شوبيفاي",
    nameEn: "Shopify",
    description: "اربط متجرك على شوبيفاي — قريباً",
    logo: "🟢",
    gradient: "from-green-600 to-emerald-600",
    available: false,
  },
];

export default function ConnectStorePage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <ConnectStoreContent />
    </Suspense>
  );
}

function ConnectStoreContent() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // معالجة نتيجة الربط من الـ callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const storeName = searchParams.get("store");

    if (success === "true" && storeName) {
      setStatusMessage({
        type: "success",
        text: `تم ربط "${decodeURIComponent(storeName)}" بنجاح! يمكنك الآن إنشاء سيناريوهات.`,
      });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        denied: "تم رفض طلب الربط من قبل التاجر",
        no_code: "لم يتم استلام كود التصريح",
        auth_failed: "فشل عملية المصادقة — حاول مرة ثانية",
      };
      setStatusMessage({
        type: "error",
        text: errorMessages[error] || "حدث خطأ غير متوقع",
      });
    }
  }, [searchParams]);

  function handleConnect(platformId: string) {
    if (platformId !== "salla") return;

    setConnecting(platformId);

    // توليد state عشوائي للحماية من CSRF
    const state = crypto.randomUUID();
    sessionStorage.setItem("salla_oauth_state", state);

    // بناء رابط OAuth
    const clientId = process.env.NEXT_PUBLIC_SALLA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/salla/callback`;

    const params = new URLSearchParams({
      client_id: clientId || "",
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "offline_access customers.read orders.read carts.read coupons.read.write products.read",
      state,
    });

    // توجيه المستخدم لصفحة سلة
    window.location.href = `https://accounts.salla.sa/oauth2/auth?${params.toString()}`;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">ربط المتجر</h1>
        <p className="text-gray-500">اربط متجرك الإلكتروني لتفعيل نظام العروض الذكية</p>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {statusMessage.type === "success" ? "✅" : "❌"}
            </span>
            <p className="text-sm font-medium">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* Platforms grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`bg-[#111827] border rounded-2xl p-6 transition-all duration-300 ${
              platform.available
                ? "border-gray-800 hover:border-gray-700"
                : "border-gray-800/50 opacity-60"
            }`}
          >
            {/* Logo & name */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-14 h-14 bg-gradient-to-br ${platform.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <span className="text-2xl">{platform.logo}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{platform.name}</h3>
                <p className="text-xs text-gray-500">{platform.nameEn}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {platform.description}
            </p>

            {/* Connect button */}
            {platform.available ? (
              <button
                onClick={() => handleConnect(platform.id)}
                disabled={connecting === platform.id}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  connecting === platform.id
                    ? "bg-gray-800 text-gray-500 cursor-wait"
                    : "bg-gradient-to-l from-emerald-500 to-cyan-500 text-[#0F1629] hover:shadow-lg hover:shadow-emerald-500/20"
                }`}
              >
                {connecting === platform.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري الربط...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    ربط المتجر
                  </span>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 rounded-xl text-sm font-medium bg-gray-800/50 text-gray-600 cursor-not-allowed"
              >
                قريباً
              </button>
            )}
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-10 bg-[#111827] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">كيف يعمل الربط؟</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "اربط متجرك", desc: "اضغط على زر الربط وسجّل الدخول في حسابك على المنصة", icon: "🔗" },
            { step: "2", title: "وافق على الصلاحيات", desc: "نطلب صلاحية قراءة العملاء والطلبات والسلات وإنشاء كوبونات", icon: "✅" },
            { step: "3", title: "مزامنة تلقائية", desc: "نسحب بيانات عملائك وطلباتك تلقائياً كل ساعة", icon: "🔄" },
            { step: "4", title: "ابدأ الأتمتة", desc: "أنشئ سيناريوهات وخلّ النظام يشتغل لحاله!", icon: "🚀" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">{item.icon}</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions note */}
      <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-medium text-amber-400 mb-1">أمان بياناتك</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              نستخدم بروتوكول OAuth 2.0 الآمن للربط. لا نخزّن كلمة مرورك أبداً.
              يمكنك إلغاء الربط في أي وقت من إعدادات المنصة.
              التوكنات مشفّرة ومحفوظة بأمان.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
