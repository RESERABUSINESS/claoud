// =============================================
// إعدادات الـ Cron Jobs
// =============================================
// هذا الملف يوثّق جدولة المهام التلقائية ويوفر ثوابت مشتركة
//
// المهام:
// 1. تشغيل محرك السيناريوهات — كل 15 دقيقة
// 2. مزامنة العملاء من المنصات — كل ساعة
// =============================================

export const CRON_JOBS = {
  // تشغيل محرك السيناريوهات
  runScenarios: {
    path: "/api/cron/run-scenarios",
    schedule: "*/15 * * * *", // كل 15 دقيقة
    description: "تشغيل محرك السيناريوهات — يفحص السلات المتروكة، العملاء الخاملين، الجدد، VIP، وأعياد الميلاد",
  },

  // مزامنة بيانات العملاء
  syncCustomers: {
    path: "/api/cron/sync-customers",
    schedule: "0 * * * *", // كل ساعة عند الدقيقة 0
    description: "سحب بيانات العملاء الجدد من المنصات وتحديث التصنيفات",
  },
} as const;

// الحد الأقصى لوقت التشغيل (بالثواني)
export const CRON_MAX_DURATION = {
  runScenarios: 60,    // دقيقة واحدة
  syncCustomers: 300,  // 5 دقائق
} as const;

// =============================================
// طريقة الربط حسب منصة الاستضافة
// =============================================
//
// ─── Vercel Cron ───────────────────────────
//
// 1. أضف CRON_SECRET في متغيرات البيئة على Vercel Dashboard
//
// 2. ملف vercel.json (موجود في المشروع):
//    {
//      "crons": [
//        {
//          "path": "/api/cron/run-scenarios",
//          "schedule": "*/15 * * * *"
//        },
//        {
//          "path": "/api/cron/sync-customers",
//          "schedule": "0 * * * *"
//        }
//      ]
//    }
//
// 3. Vercel يرسل header تلقائياً:
//    Authorization: Bearer <CRON_SECRET>
//
// ─── Railway ───────────────────────────────
//
// 1. أضف CRON_SECRET في متغيرات البيئة
//
// 2. استخدم Railway Cron Service:
//    - أنشئ service جديد نوعه Cron
//    - Schedule: */15 * * * *
//    - Command:
//      curl -H "x-cron-key: $CRON_SECRET" https://your-app.railway.app/api/cron/run-scenarios
//
//    - أنشئ service ثاني:
//    - Schedule: 0 * * * *
//    - Command:
//      curl -H "x-cron-key: $CRON_SECRET" https://your-app.railway.app/api/cron/sync-customers
//
// ─── VPS / سيرفر خاص ──────────────────────
//
// 1. أضف crontab:
//    crontab -e
//
// 2. أضف الأسطر التالية:
//    */15 * * * * curl -s -H "x-cron-key: YOUR_SECRET" https://your-domain.com/api/cron/run-scenarios
//    0 * * * *    curl -s -H "x-cron-key: YOUR_SECRET" https://your-domain.com/api/cron/sync-customers
//
// ─── GitHub Actions ────────────────────────
//
// أنشئ ملف .github/workflows/cron.yml:
//
//   name: Cron Jobs
//   on:
//     schedule:
//       - cron: '*/15 * * * *'
//   jobs:
//     run-scenarios:
//       runs-on: ubuntu-latest
//       steps:
//         - run: |
//             curl -s -H "x-cron-key: ${{ secrets.CRON_SECRET }}" \
//               https://your-domain.com/api/cron/run-scenarios
//
// =============================================
