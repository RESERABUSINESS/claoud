import type { ScenarioType } from "@/types";

interface StepTypeProps {
  selected: ScenarioType | null;
  onSelect: (type: ScenarioType) => void;
}

const scenarioTypes: {
  type: ScenarioType;
  icon: string;
  label: string;
  description: string;
  gradient: string;
}[] = [
  {
    type: "ABANDONED_CART",
    icon: "🛒",
    label: "سلة متروكة",
    description: "استرجع العملاء اللي تركوا سلة التسوق بدون ما يكملوا الطلب. ذكّرهم بمنتجاتهم مع خصم تحفيزي.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    type: "DORMANT",
    icon: "😴",
    label: "عميل غايب",
    description: "أعد جذب العملاء اللي ما طلبوا من فترة طويلة. حفّزهم يرجعوا بعرض حصري.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    type: "WELCOME",
    icon: "👋",
    label: "ترحيب عميل جديد",
    description: "رحّب بالعملاء الجدد واعطهم خصم على أول طلب. الانطباع الأول مهم!",
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    type: "VIP",
    icon: "👑",
    label: "عميل VIP",
    description: "كافئ أفضل عملائك بعروض حصرية. خلّهم يحسّون إنهم مميزين عندك.",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    type: "BIRTHDAY",
    icon: "🎂",
    label: "عيد ميلاد",
    description: "فاجئ عملائك بعرض خاص في يوم ميلادهم. لمسة شخصية تبني ولاء.",
    gradient: "from-pink-500 to-rose-500",
  },
];

export default function StepType({ selected, onSelect }: StepTypeProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">اختر نوع السيناريو</h2>
      <p className="text-sm text-gray-500 mb-6">حدد نوع الأتمتة اللي تبي تنشئها</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarioTypes.map((scenario) => {
          const isSelected = selected === scenario.type;
          return (
            <button
              key={scenario.type}
              type="button"
              onClick={() => onSelect(scenario.type)}
              className={`relative text-right p-5 rounded-2xl border-2 transition-all duration-300 group ${
                isSelected
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                  : "border-gray-800 bg-[#111827] hover:border-gray-700 hover:bg-[#151D2E]"
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 left-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className={`w-12 h-12 bg-gradient-to-br ${scenario.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{scenario.icon}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{scenario.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{scenario.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
