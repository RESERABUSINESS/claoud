// =============================================
// Cloudflare Worker — Cron Triggers
// =============================================
// يشغّل محرك السيناريوهات ومزامنة العملاء تلقائياً
//
// النشر:
//   cd cloudflare-cron
//   wrangler deploy
//
// اختبار محلي:
//   wrangler dev --test-scheduled
// =============================================

export interface Env {
  CRON_SECRET: string;
  APP_URL: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const headers: Record<string, string> = {
      "x-cron-key": env.CRON_SECRET,
      "Content-Type": "application/json",
    };

    let endpoint = "";
    let jobName = "";

    switch (event.cron) {
      // كل 15 دقيقة — تشغيل محرك السيناريوهات
      case "*/15 * * * *":
        endpoint = "/api/cron/run-scenarios";
        jobName = "محرك السيناريوهات";
        break;

      // كل ساعة — مزامنة العملاء
      case "0 * * * *":
        endpoint = "/api/cron/sync-customers";
        jobName = "مزامنة العملاء";
        break;

      default:
        console.log(`[Cron] جدولة غير معروفة: ${event.cron}`);
        return;
    }

    const url = `${env.APP_URL}${endpoint}`;
    console.log(`[Cron] بدء ${jobName} — ${url}`);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      const data = await response.json() as { success: boolean; message?: string; error?: string };

      if (response.ok && data.success) {
        console.log(`[Cron] ${jobName} اكتمل بنجاح: ${data.message}`);
      } else {
        console.error(`[Cron] ${jobName} فشل: ${data.error || response.statusText}`);
      }
    } catch (err) {
      console.error(`[Cron] خطأ في ${jobName}:`, err);
    }
  },
};
