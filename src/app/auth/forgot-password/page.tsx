"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "حدث خطأ. حاول مرة ثانية.");
        return;
      }

      setSent(true);
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة ثانية.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl text-center">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">تم الإرسال</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          إذا كان الإيميل <span className="text-cyan-400 font-medium" dir="ltr">{email}</span> مسجّل عندنا،
          تم إرسال رابط لاستعادة كلمة المرور.
          <br />
          تحقق من بريدك الإلكتروني.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          رجوع لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1">نسيت كلمة المرور؟</h2>
      <p className="text-sm text-gray-500 mb-6">أدخل إيميلك ونرسل لك رابط استعادة كلمة المرور</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@store.com"
            required
            dir="ltr"
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-l from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري الإرسال...
            </span>
          ) : (
            "إرسال رابط الاستعادة"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          رجوع لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
