// =============================================
// إعدادات الـ Cron Jobs — Cloudflare Workers
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
// طريقة الربط مع Cloudflare
// =============================================
//
// ─── الطريقة 1: Cloudflare Workers Cron Triggers (الأفضل) ─────
//
// 1. أنشئ Worker جديد في Cloudflare Dashboard أو استخدم Wrangler CLI:
//
//    npm install -g wrangler
//    wrangler init smart-offers-cron
//
// 2. ملف wrangler.toml:
//
//    name = "smart-offers-cron"
//    main = "src/worker.ts"
//    compatibility_date = "2024-01-01"
//
//    [triggers]
//    crons = ["*/15 * * * *", "0 * * * *"]
//
//    [vars]
//    APP_URL = "https://your-app.pages.dev"
//
// 3. أضف CRON_SECRET كـ secret:
//    wrangler secret put CRON_SECRET
//
// 4. ملف src/worker.ts:
//
//    export default {
//      async scheduled(event: ScheduledEvent, env: Env) {
//        const headers = {
//          "x-cron-key": env.CRON_SECRET,
//          "Content-Type": "application/json",
//        };
//
//        switch (event.cron) {
//          case "*/15 * * * *":
//            await fetch(`${env.APP_URL}/api/cron/run-scenarios`, { headers });
//            break;
//          case "0 * * * *":
//            await fetch(`${env.APP_URL}/api/cron/sync-customers`, { headers });
//            break;
//        }
//      },
//    };
//
//    interface Env {
//      CRON_SECRET: string;
//      APP_URL: string;
//    }
//
// 5. نشر Worker:
//    wrangler deploy
//
// ─── الطريقة 2: Cloudflare Pages + Functions (إذا التطبيق على Pages) ───
//
// 1. أنشئ ملف functions/_middleware.ts أو استخدم Worker منفصل
//    لأن Cloudflare Pages ما يدعم Cron Triggers مباشرة
//
// 2. أنشئ Worker مساعد (كما في الطريقة 1) ينادي تطبيقك على Pages
//
// ─── الطريقة 3: Cloudflare Workers + Next.js (OpenNext / @opennextjs/cloudflare) ───
//
// إذا تستخدم @opennextjs/cloudflare لنشر Next.js:
//
// 1. أضف cron triggers في wrangler.toml الخاص بالتطبيق:
//
//    [triggers]
//    crons = ["*/15 * * * *", "0 * * * *"]
//
// 2. أضف scheduled handler في open-next.config.ts أو worker entry point
//
// 3. Cloudflare يستدعي الـ scheduled event تلقائياً
//    والـ handler ينادي الـ API routes الداخلية
//
// ─── الطريقة 4: External Cron Service ─────────────────────
//
// استخدم خدمة خارجية مثل cron-job.org أو EasyCron:
//
// 1. سجّل في https://cron-job.org (مجاني)
//
// 2. أنشئ مهمة 1:
//    - URL: https://your-app.pages.dev/api/cron/run-scenarios
//    - Schedule: Every 15 minutes
//    - Headers: x-cron-key: YOUR_CRON_SECRET
//
// 3. أنشئ مهمة 2:
//    - URL: https://your-app.pages.dev/api/cron/sync-customers
//    - Schedule: Every 1 hour
//    - Headers: x-cron-key: YOUR_CRON_SECRET
//
// ─── اختبار محلي ─────────────────────────────────────────
//
// curl -H "x-cron-key: YOUR_SECRET" http://localhost:3000/api/cron/run-scenarios
// curl -H "x-cron-key: YOUR_SECRET" http://localhost:3000/api/cron/sync-customers
//
// أو عبر wrangler:
// wrangler dev --test-scheduled
//
// =============================================
