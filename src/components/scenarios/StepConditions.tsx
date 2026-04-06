import type { ScenarioType } from "@/types";

export interface ConditionsData {
  waitMinutes: number;
  dormantDays: number;
  vipMinSpent: number;
  vipMinOrders: number;
  birthdayDaysBefore: number;
}

interface StepConditionsProps {
  type: ScenarioType;
  conditions: ConditionsData;
  onChange: (conditions: ConditionsData) => void;
}

function InputField({
  label,
  hint,
  value,
  suffix,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <p className="text-xs text-gray-600 mb-3">{hint}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">{suffix}</span>
      </div>
    </div>
  );
}

function RangeField({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <p className="text-xs text-gray-600 mb-4">{hint}</p>
      <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-4">
        <div className="flex justify-between mb-3">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-sm text-gray-500 self-end">{suffix}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-emerald-500
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-emerald-500/30"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-600">{min}</span>
          <span className="text-[10px] text-gray-600">{max}</span>
        </div>
      </div>
    </div>
  );
}

export default function StepConditions({ type, conditions, onChange }: StepConditionsProps) {
  const titles: Record<ScenarioType, string> = {
    ABANDONED_CART: "شروط السلة المتروكة",
    DORMANT: "شروط العميل الغايب",
    WELCOME: "شروط الترحيب",
    VIP: "شروط عميل VIP",
    BIRTHDAY: "شروط عيد الميلاد",
  };

  const descriptions: Record<ScenarioType, string> = {
    ABANDONED_CART: "حدد كم يمر وقت على السلة المتروكة قبل ما نرسل التذكير",
    DORMANT: "حدد عدد أيام الغياب اللي بعدها نعتبر العميل خامل",
    WELCOME: "إعدادات رسالة الترحيب — ترسل تلقائياً بعد أول تسجيل",
    VIP: "حدد الشروط اللي تخلّي العميل يتأهل لعروض VIP",
    BIRTHDAY: "حدد متى ترسل عرض عيد الميلاد بالنسبة لتاريخ الميلاد",
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">{titles[type]}</h2>
      <p className="text-sm text-gray-500 mb-6">{descriptions[type]}</p>

      <div className="max-w-lg space-y-6">
        {type === "ABANDONED_CART" && (
          <RangeField
            label="وقت الانتظار قبل الإرسال"
            hint="كم دقيقة ننتظر بعد ما العميل يترك السلة؟"
            value={conditions.waitMinutes}
            min={5}
            max={1440}
            step={5}
            suffix="دقيقة"
            onChange={(v) => onChange({ ...conditions, waitMinutes: v })}
          />
        )}

        {type === "DORMANT" && (
          <RangeField
            label="عدد أيام الغياب"
            hint="بعد كم يوم بدون طلب نعتبر العميل غايب؟"
            value={conditions.dormantDays}
            min={7}
            max={180}
            step={1}
            suffix="يوم"
            onChange={(v) => onChange({ ...conditions, dormantDays: v })}
          />
        )}

        {type === "WELCOME" && (
          <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">تلقائي</p>
                <p className="text-xs text-gray-500">يرسل فوراً عند تسجيل عميل جديد</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              رسالة الترحيب ترسل تلقائياً لكل عميل جديد يسجّل في متجرك.
              تقدر تخصّص الرسالة والخصم في الخطوات الجاية.
            </p>
          </div>
        )}

        {type === "VIP" && (
          <div className="space-y-6">
            <InputField
              label="الحد الأدنى للمشتريات"
              hint="إجمالي المبالغ اللي صرفها العميل"
              value={conditions.vipMinSpent}
              suffix="ر.س"
              onChange={(v) => onChange({ ...conditions, vipMinSpent: v })}
            />
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-800"></div>
              <span className="text-xs text-gray-600">أو</span>
              <div className="flex-1 border-t border-gray-800"></div>
            </div>
            <InputField
              label="الحد الأدنى لعدد الطلبات"
              hint="عدد الطلبات المكتملة"
              value={conditions.vipMinOrders}
              suffix="طلب"
              onChange={(v) => onChange({ ...conditions, vipMinOrders: v })}
            />
          </div>
        )}

        {type === "BIRTHDAY" && (
          <RangeField
            label="إرسال العرض قبل الميلاد بـ"
            hint="كم يوم قبل عيد ميلاد العميل نرسل العرض؟ (0 = نفس اليوم)"
            value={conditions.birthdayDaysBefore}
            min={0}
            max={7}
            step={1}
            suffix="يوم"
            onChange={(v) => onChange({ ...conditions, birthdayDaysBefore: v })}
          />
        )}
      </div>
    </div>
  );
}
