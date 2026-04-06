interface StepProgressProps {
  currentStep: number;
  steps: { label: string; icon: string }[];
}

export default function StepProgress({ currentStep, steps }: StepProgressProps) {
  return (
    <div className="mb-8">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 right-5 left-5 h-[2px] bg-gray-800" />
        {/* Progress line */}
        <div
          className="absolute top-5 right-5 h-[2px] bg-gradient-to-l from-emerald-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, maxWidth: "calc(100% - 40px)" }}
        />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={step.label} className="relative flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : isActive
                      ? "bg-gradient-to-br from-emerald-400 to-cyan-400 text-[#0F1629] shadow-lg shadow-emerald-500/20"
                      : "bg-[#1A2235] text-gray-600 border border-gray-800"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isActive ? "text-emerald-400" : isCompleted ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-emerald-400">
            الخطوة {currentStep} من {steps.length}
          </span>
          <span className="text-sm text-gray-500">{steps[currentStep - 1].label}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-l from-emerald-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
