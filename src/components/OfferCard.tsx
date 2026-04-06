import type { Scenario } from "@/types";
import { getScenarioTypeLabel, getDiscountTypeLabel, getChannelLabel } from "@/lib/utils";

interface ScenarioCardProps {
  scenario: Scenario;
}

export default function ScenarioCard({ scenario }: ScenarioCardProps) {
  const statusLabel = scenario.isActive ? "نشط" : "معطّل";
  const statusColor = scenario.isActive
    ? "bg-emerald-100 text-emerald-600"
    : "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {getScenarioTypeLabel(scenario.type)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">نوع الخصم:</span>
          <span className="font-medium mr-1">{getDiscountTypeLabel(scenario.discountType)}</span>
        </div>
        <div>
          <span className="text-gray-500">القيمة:</span>
          <span className="font-medium mr-1">
            {scenario.discountType === "PERCENTAGE"
              ? `${scenario.discountValue}%`
              : scenario.discountType === "FREE_SHIPPING"
                ? "مجاني"
                : `${scenario.discountValue} ر.س`}
          </span>
        </div>
        <div>
          <span className="text-gray-500">القناة:</span>
          <span className="font-medium mr-1">{getChannelLabel(scenario.channel)}</span>
        </div>
        <div>
          <span className="text-gray-500">الانتظار:</span>
          <span className="font-medium mr-1">
            {scenario.waitDuration > 0 ? `${scenario.waitDuration} دقيقة` : "فوري"}
          </span>
        </div>
      </div>

      {scenario.couponPrefix && (
        <div className="mt-4 bg-gray-50 rounded-lg px-4 py-2 text-center">
          <span className="text-xs text-gray-500">بادئة الكوبون:</span>
          <span className="font-mono font-bold text-emerald-600 mr-2">
            {scenario.couponPrefix}
          </span>
        </div>
      )}
    </div>
  );
}
