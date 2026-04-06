"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // مؤشر قوة كلمة المرور
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(form.password);
  const strengthLabels = ["", "ضعيفة", "متوسطة", "جيدة", "قوية"];
  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-cyan-500", "bg-emerald-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "حدث خطأ أثناء التسجيل");
        return;
      }

      // توجيه لصفحة تسجيل الدخول
      router.push("/auth/login?registered=1");
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة ثانية.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1">إنشاء حساب جديد</h2>
      <p className="text-sm text-gray-500 mb-6">سجّل عشان تبدأ تستخدم عروض ذكية</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* الاسم */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">الاسم الكامل</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="أحمد محمد"
            required
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors text-sm"
          />
        </div>

        {/* الإيميل */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="example@store.com"
            required
            dir="ltr"
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors text-sm"
          />
        </div>

        {/* كلمة المرور */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">كلمة المرور</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="8 أحرف على الأقل — حرف كبير + رقم"
              required
              dir="ltr"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors text-sm pl-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          {/* مؤشر القوة */}
          {form.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= level ? strengthColors[strength] : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${strength <= 1 ? "text-red-400" : strength === 2 ? "text-amber-400" : "text-emerald-400"}`}>
                {strengthLabels[strength]}
              </p>
            </div>
          )}
        </div>

        {/* تأكيد كلمة المرور */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">تأكيد كلمة المرور</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            required
            dir="ltr"
            className={`w-full bg-[#0B1120] border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-1 outline-none transition-colors text-sm ${
              form.confirmPassword && form.confirmPassword !== form.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/30"
            }`}
          />
          {form.confirmPassword && form.confirmPassword !== form.password && (
            <p className="text-xs text-red-400 mt-1">كلمة المرور غير متطابقة</p>
          )}
        </div>

        {/* زر التسجيل */}
        <button
          type="submit"
          disabled={loading || (form.confirmPassword !== "" && form.confirmPassword !== form.password)}
          className="w-full bg-gradient-to-l from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري إنشاء الحساب...
            </span>
          ) : (
            "إنشاء الحساب"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        عندك حساب؟{" "}
        <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          سجّل دخول
        </Link>
      </p>
    </div>
  );
}
