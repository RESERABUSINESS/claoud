"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Provider = "meta" | "twilio";
type TestStatus = "idle" | "testing" | "success" | "error";

export default function WhatsAppSettingsPage() {
  const [provider, setProvider] = useState<Provider>("meta");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testPhone, setTestPhone] = useState("");

  // Meta fields
  const [metaPhoneId, setMetaPhoneId] = useState("");
  const [metaToken, setMetaToken] = useState("");

  // Twilio fields
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");

  async function handleTestConnection() {
    setTestStatus("testing");
    try {
      const res = await fetch("/api/settings/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          phone: testPhone,
          ...(provider === "meta" ? { phoneNumberId: metaPhoneId, accessToken: metaToken } : {}),
          ...(provider === "twilio" ? { accountSid: twilioSid, authToken: twilioToken, fromNumber: twilioFrom } : {}),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestStatus("success");
        setTestMessage("تم إرسال الرسالة التجريبية بنجاح!");
      } else {
        setTestStatus("error");
        setTestMessage(data.error || "فشل الإرسال");
      }
    } catch {
      setTestStatus("error");
      setTestMessage("حدث خطأ في الاتصال");
    }
  }

  async function handleSave() {
    try {
      const res = await fetch("/api/settings/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          ...(provider === "meta" ? { phoneNumberId: metaPhoneId, accessToken: metaToken } : {}),
          ...(provider === "twilio" ? { accountSid: twilioSid, authToken: twilioToken, fromNumber: twilioFrom } : {}),
        }),
      });

      if (res.ok) {
        setTestMessage("تم حفظ الإعدادات بنجاح");
        setTestStatus("success");
      }
    } catch {
      setTestMessage("فشل حفظ الإعدادات");
      setTestStatus("error");
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">إعدادات الواتساب</h1>
          <p className="text-gray-500">اربط حساب واتساب بزنس لإرسال العروض تلقائياً</p>
        </div>

        {/* Provider Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">اختر المزوّد</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("meta")}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                provider === "meta"
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-gray-800 bg-[#111827] hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📱</span>
                <span className={`text-sm font-bold ${provider === "meta" ? "text-white" : "text-gray-400"}`}>
                  WhatsApp Business API
                </span>
              </div>
              <p className="text-xs text-gray-600">الـ API الرسمي من Meta — يحتاج حساب بزنس معتمد</p>
            </button>

            <button
              type="button"
              onClick={() => setProvider("twilio")}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                provider === "twilio"
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-gray-800 bg-[#111827] hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🔴</span>
                <span className={`text-sm font-bold ${provider === "twilio" ? "text-white" : "text-gray-400"}`}>
                  Twilio WhatsApp
                </span>
              </div>
              <p className="text-xs text-gray-600">أسهل في الإعداد — مناسب للتجربة والشركات الصغيرة</p>
            </button>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">
            بيانات الاتصال — {provider === "meta" ? "Meta WhatsApp" : "Twilio"}
          </h3>

          {provider === "meta" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Phone Number ID</label>
                <input
                  type="text"
                  value={metaPhoneId}
                  onChange={(e) => setMetaPhoneId(e.target.value)}
                  placeholder="مثال: 123456789012345"
                  dir="ltr"
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Access Token</label>
                <input
                  type="password"
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="EAAxxxxxxx..."
                  dir="ltr"
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                />
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="text-cyan-400 font-medium">كيف تحصل عليها؟</span> — سجّل في{" "}
                  <span className="text-cyan-400">Meta for Developers</span>، أنشئ تطبيق WhatsApp Business،
                  وانسخ الـ Phone Number ID والـ Access Token من لوحة التحكم.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Account SID</label>
                <input
                  type="text"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  dir="ltr"
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Auth Token</label>
                <input
                  type="password"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  dir="ltr"
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">WhatsApp From Number</label>
                <input
                  type="text"
                  value={twilioFrom}
                  onChange={(e) => setTwilioFrom(e.target.value)}
                  placeholder="+14155238886"
                  dir="ltr"
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Connection */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">اختبار الاتصال</h3>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="flex-1 bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
            />
            <button
              onClick={handleTestConnection}
              disabled={testStatus === "testing" || !testPhone}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                testStatus === "testing"
                  ? "bg-gray-800 text-gray-500 cursor-wait"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              }`}
            >
              {testStatus === "testing" ? "جاري الاختبار..." : "إرسال رسالة تجريبية"}
            </button>
          </div>

          {testMessage && (
            <div
              className={`p-3 rounded-xl text-sm ${
                testStatus === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {testMessage}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">القوالب المعتمدة</h3>
            <span className="text-xs text-gray-600">Meta WhatsApp فقط</span>
          </div>

          <div className="space-y-3">
            {[
              { name: "abandoned_cart_reminder", status: "APPROVED", desc: "تذكير السلة المتروكة" },
              { name: "welcome_offer", status: "APPROVED", desc: "عرض ترحيب عميل جديد" },
              { name: "dormant_customer", status: "PENDING", desc: "تنشيط عميل خامل" },
              { name: "birthday_offer", status: "APPROVED", desc: "عرض عيد ميلاد" },
            ].map((template) => (
              <div
                key={template.name}
                className="flex items-center justify-between bg-white/[0.02] border border-gray-800/50 rounded-xl p-3"
              >
                <div>
                  <p className="text-sm text-white font-mono">{template.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{template.desc}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    template.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {template.status === "APPROVED" ? "معتمد" : "بانتظار الموافقة"}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 mt-3">
            القوالب تُنشأ من لوحة تحكم Meta Business وتحتاج موافقة قبل الاستخدام.
          </p>
        </div>

        {/* Rate limits info */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">حدود الإرسال</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">80</p>
              <p className="text-[10px] text-gray-600">رسالة / دقيقة</p>
              <p className="text-[10px] text-gray-500">واتساب</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cyan-400">3</p>
              <p className="text-[10px] text-gray-600">رسائل / رقم / 5 دقائق</p>
              <p className="text-[10px] text-gray-500">حماية التكرار</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-violet-400">1,000</p>
              <p className="text-[10px] text-gray-600">رسالة / يوم (مبدئي)</p>
              <p className="text-[10px] text-gray-500">يزيد مع الاستخدام</p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-l from-emerald-500 to-cyan-500 text-[#0F1629] font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all text-sm"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
