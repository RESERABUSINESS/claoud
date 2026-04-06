"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StepProgress from "@/components/scenarios/StepProgress";
import StepType from "@/components/scenarios/StepType";
import StepConditions, { type ConditionsData } from "@/components/scenarios/StepConditions";
import StepDiscount, { type DiscountData } from "@/components/scenarios/StepDiscount";
import StepMessage, { type MessageData } from "@/components/scenarios/StepMessage";
import StepReview from "@/components/scenarios/StepReview";
import type { ScenarioType } from "@/types";

const steps = [
  { label: "النوع", icon: "⚡" },
  { label: "الشروط", icon: "⚙️" },
  { label: "العرض", icon: "🏷️" },
  { label: "الرسالة", icon: "💬" },
  { label: "مراجعة", icon: "✅" },
];

const defaultMessages: Record<ScenarioType, string> = {
  ABANDONED_CART:
    "أهلاً {اسم_العميل} 👋\n\nلاحظنا إنك نسيت {اسم_المنتج} في سلتك!\n\nعشان كذا جهزنا لك كوبون خصم: {الكوبون}\nخصم {قيمة_الخصم} على طلبك 🎉\n\nلا تفوّت الفرصة، الكوبون لفترة محدودة!",
  DORMANT:
    "وحشتنا يا {اسم_العميل}! 💛\n\nصار لك فترة ما زرتنا، وجهزنا لك عرض خاص:\n\nكوبون خصم: {الكوبون}\nخصم {قيمة_الخصم} على طلبك القادم ✨\n\nننتظرك!",
  WELCOME:
    "أهلاً وسهلاً {اسم_العميل}! 🎉\n\nمنوّر متجرنا! عشان أول طلب لك جهزنا لك هدية:\n\nكوبون خصم: {الكوبون}\nخصم {قيمة_الخصم} 🛍️\n\nتسوّق بسعادة!",
  VIP:
    "مرحباً {اسم_العميل} 👑\n\nأنت من عملائنا المميزين وعشان كذا عندنا لك عرض حصري:\n\nكوبون: {الكوبون}\nخصم {قيمة_الخصم} 🌟\n\nشكراً لثقتك فينا!",
  BIRTHDAY:
    "كل عام وأنت بخير يا {اسم_العميل}! 🎂🎉\n\nبمناسبة عيد ميلادك جهزنا لك هدية:\n\nكوبون خصم: {الكوبون}\nخصم {قيمة_الخصم} 🎁\n\nعقبال 100 سنة!",
};

export default function NewScenarioPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [scenarioType, setScenarioType] = useState<ScenarioType | null>(null);

  // Step 2
  const [conditions, setConditions] = useState<ConditionsData>({
    waitMinutes: 30,
    dormantDays: 30,
    vipMinSpent: 5000,
    vipMinOrders: 10,
    birthdayDaysBefore: 1,
  });

  // Step 3
  const [discount, setDiscount] = useState<DiscountData>({
    discountType: "PERCENTAGE",
    discountValue: 15,
    couponPrefix: "",
    couponExpiryDays: 7,
  });

  // Step 4
  const [message, setMessage] = useState<MessageData>({
    channel: "WHATSAPP",
    messageTemplate: "",
  });

  function canGoNext(): boolean {
    switch (currentStep) {
      case 1: return scenarioType !== null;
      case 2: return true;
      case 3: return discount.discountType === "FREE_SHIPPING" || discount.discountValue > 0;
      case 4: return message.messageTemplate.trim().length > 0;
      default: return true;
    }
  }

  function goNext() {
    if (!canGoNext()) return;

    // عند الانتقال من الخطوة 2 للـ 3، نضبط البادئة حسب النوع
    if (currentStep === 2 && !discount.couponPrefix && scenarioType) {
      const prefixes: Record<ScenarioType, string> = {
        ABANDONED_CART: "CART",
        DORMANT: "BACK",
        WELCOME: "WELCOME",
        VIP: "VIP",
        BIRTHDAY: "BDAY",
      };
      setDiscount((d) => ({ ...d, couponPrefix: prefixes[scenarioType] }));
    }

    // عند الانتقال من الخطوة 3 للـ 4، نضبط الرسالة الافتراضية
    if (currentStep === 3 && !message.messageTemplate && scenarioType) {
      setMessage((m) => ({ ...m, messageTemplate: defaultMessages[scenarioType] }));
    }

    setCurrentStep((s) => Math.min(s + 1, 5));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function getDiscountPreview(): string {
    if (discount.discountType === "FREE_SHIPPING") return "شحن مجاني";
    if (discount.discountType === "PERCENTAGE") return `${discount.discountValue}%`;
    return `${discount.discountValue} ر.س`;
  }

  function handleSaveDraft() {
    alert("تم حفظ السيناريو كمسودة");
    router.push("/dashboard");
  }

  function handleActivate() {
    alert("تم تفعيل السيناريو بنجاح!");
    router.push("/dashboard");
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">سيناريو جديد</h1>
          <p className="text-xs text-gray-500">أنشئ سيناريو أتمتة جديد لمتجرك</p>
        </div>
      </div>

      {/* Progress bar */}
      <StepProgress currentStep={currentStep} steps={steps} />

      {/* Step content */}
      <div className="bg-[#0F1629] border border-gray-800 rounded-2xl p-6 lg:p-8 mb-6">
        {currentStep === 1 && (
          <StepType selected={scenarioType} onSelect={setScenarioType} />
        )}

        {currentStep === 2 && scenarioType && (
          <StepConditions type={scenarioType} conditions={conditions} onChange={setConditions} />
        )}

        {currentStep === 3 && (
          <StepDiscount data={discount} onChange={setDiscount} />
        )}

        {currentStep === 4 && (
          <StepMessage
            data={message}
            onChange={setMessage}
            previewValues={{
              customerName: "محمد العتيبي",
              couponCode: `${discount.couponPrefix || "CODE"}-X7K2M`,
              discountValue: getDiscountPreview(),
              productName: "ساعة كاسيو كلاسيك",
            }}
          />
        )}

        {currentStep === 5 && scenarioType && (
          <StepReview
            scenarioType={scenarioType}
            conditions={conditions}
            discount={discount}
            channel={message.channel}
            messageTemplate={message.messageTemplate}
            onSaveDraft={handleSaveDraft}
            onActivate={handleActivate}
          />
        )}
      </div>

      {/* Navigation buttons */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentStep === 1
                ? "text-gray-700 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            السابق
          </button>

          <button
            onClick={goNext}
            disabled={!canGoNext()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              canGoNext()
                ? "bg-gradient-to-l from-emerald-500 to-cyan-500 text-[#0F1629] hover:shadow-lg hover:shadow-emerald-500/20"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            التالي
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
