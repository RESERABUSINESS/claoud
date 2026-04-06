import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-600">عروض ذكية</h1>
          <nav className="flex gap-4">
            <Link
              href="/dashboard"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              لوحة التحكم
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            أتمتة العروض والخصومات
            <span className="text-emerald-600"> بذكاء</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            نظام متكامل لإدارة وأتمتة العروض والخصومات الذكية للمتاجر
            الإلكترونية السعودية. زد مبيعاتك وحافظ على عملائك.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              ابدأ الآن
            </Link>
            <Link
              href="/docs"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              التوثيق
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">عروض مستهدفة</h3>
              <p className="text-gray-600">
                استهدف العملاء المناسبين بالعروض المناسبة بناءً على سلوكهم
                الشرائي.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">أتمتة كاملة</h3>
              <p className="text-gray-600">
                أنشئ قواعد ذكية لتفعيل العروض تلقائياً بدون تدخل يدوي.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">تقارير وتحليلات</h3>
              <p className="text-gray-600">
                تابع أداء عروضك بتقارير مفصلة وتحليلات دقيقة في الوقت الفعلي.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>© 2026 عروض ذكية. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
