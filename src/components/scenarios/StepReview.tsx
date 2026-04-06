import type { ScenarioType, DiscountType, Channel } from "@/types";
import type { ConditionsData } from "./StepConditions";
import type { DiscountData } from "./StepDiscount";

interface StepReviewProps {
  scenarioType: ScenarioType;
  conditions: ConditionsData;
  discount: DiscountData;
  channel: Channel;
  messageTemplate: string;
  onSaveDraft: () => void;
  onActivate: () => void;
}

const typeLabels: Record<ScenarioType, { label: string; icon: string }> = {
  ABANDONED_CART: { label: "سلة متروكة", icon: "🛒" },
  DORMANT: { label: "عميل غايب", icon: "😴" },
  WELCOME: { label: "ترحيب عميل جديد", icon: "👋" },
  VIP: { label: "عميل VIP", icon: "👑" },
  BIRTHDAY: { label: "عيد ميلاد", icon: "🎂" },
};

const discountLabels: Record<DiscountType, string> = {
  PERCENTAGE: "نسبة مئوية",
  FIXED: "مبلغ ثابت",
  FREE_SHIPPING: "شحن مجاني",
};

const channelLabels: Record<Channel, { label: string; icon: string }> = {
  WHATSAPP: { label: "واتساب", icon: "💬" },
  SMS: { label: "رسالة نصية", icon: "📱" },
  EMAIL: { label: "بريد إلكتروني", icon: "📧" },
};

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-white flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {value}
      </span>
    </div>
  );
}

export default function StepReview({
  scenarioType,
  conditions,
  discount,
  channel,
  messageTemplate,
  onSaveDraft,
  onActivate,
}: StepReviewProps) {
  const typeInfo = typeLabels[scenarioType];
  const channelInfo = channelLabels[channel];

  function getConditionSummary(): string {
    switch (scenarioType) {
      case "ABANDONED_CART":
        return `بعد ${conditions.waitMinutes} دقيقة من ترك السلة`;
      case "DORMANT":
        return `بعد ${conditions.dormantDays} يوم بدون طلب`;
      case "WELCOME":
        return "فوراً عند التسجيل";
      case "VIP":
        return `مشتريات ≥ ${conditions.vipMinSpent} ر.س أو ≥ ${conditions.vipMinOrders} طلب`;
      case "BIRTHDAY":
        return conditions.birthdayDaysBefore === 0
          ? "نفس يوم الميلاد"
          : `قبل ${conditions.birthdayDaysBefore} يوم من الميلاد`;
    }
  }

  function getDiscountSummary(): string {
    if (discount.discountType === "FREE_SHIPPING") return "شحن مجاني";
    if (discount.discountType === "PERCENTAGE") return `${discount.discountValue}%`;
    return `${discount.discountValue} ر.س`;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">مراجعة وتفعيل</h2>
      <p className="text-sm text-gray-500 mb-6">راجع إعدادات السيناريو قبل التفعيل</p>

      <div className="max-w-2xl space-y-6">
        {/* Type card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">{typeInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-white">{typeInfo.label}</h3>
              <p className="text-xs text-gray-500">ملخص إعدادات السيناريو</p>
            </div>
          </div>

          <SummaryRow label="شرط التفعيل" value={getConditionSummary()} />
          <SummaryRow label="نوع الخصم" value={discountLabels[discount.discountType]} />
          <SummaryRow label="قيمة الخصم" value={getDiscountSummary()} />
          <SummaryRow label="بادئة الكوبون" value={discount.couponPrefix || "—"} />
          <SummaryRow label="صلاحية الكوبون" value={`${discount.couponExpiryDays} يوم`} />
          <SummaryRow label="قناة الإرسال" value={channelInfo.label} icon={channelInfo.icon} />
        </div>

        {/* Message preview */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
          <h4 className="text-sm font-medium text-gray-400 mb-3">نص الرسالة</h4>
          <div className="bg-[#0B1120] rounded-xl p-4">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{messageTemplate}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onActivate}
            className="flex-1 bg-gradient-to-l from-emerald-500 to-cyan-500 text-[#0F1629] font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 text-sm"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              حفظ وتفعيل
            </span>
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 bg-[#111827] border border-gray-700 text-gray-300 font-medium py-3.5 rounded-xl hover:bg-[#1A2235] transition-all text-sm"
          >
            حفظ كمسودة
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center">
          عند التفعيل، السيناريو بيشتغل تلقائياً على العملاء اللي ينطبق عليهم الشرط.
        </p>
      </div>
    </div>
  );
}
