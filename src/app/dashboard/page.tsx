import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar & Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            عروض ذكية
          </Link>
          <span className="text-gray-500 text-sm">لوحة التحكم</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">إجمالي العروض</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">العروض النشطة</p>
            <p className="text-3xl font-bold text-emerald-600">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">مرات الاستخدام</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">إجمالي الخصومات</p>
            <p className="text-3xl font-bold text-gray-900">0 ر.س</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">العروض</h2>
          <Link
            href="/dashboard/offers/new"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + إنشاء عرض جديد
          </Link>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏷️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد عروض بعد
          </h3>
          <p className="text-gray-500 mb-4">
            ابدأ بإنشاء أول عرض لمتجرك
          </p>
          <Link
            href="/dashboard/offers/new"
            className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            إنشاء عرض
          </Link>
        </div>
      </main>
    </div>
  );
}
