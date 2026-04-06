import type { DiscountType } from "@/types";

export interface DiscountData {
  discountType: DiscountType;
  discountValue: number;
  couponPrefix: string;
  couponExpiryDays: number;
}

interface StepDiscountProps {
  data: DiscountData;
  onChange: (data: DiscountData) => void;
}

const discountTypes: { type: DiscountType; label: string; icon: string; description: string }[] = [
  { type: "PERCENTAGE", label: "نسبة مئوية", icon: "٪", description: "خصم بنسبة من قيمة الطلب" },
  { type: "FIXED", label: "مبلغ ثابت", icon: "﷼", description: "خصم بمبلغ محدد من الطلب" },
  { type: "FREE_SHIPPING", label: "شحن مجاني", icon: "📦", description: "إعفاء العميل من رسوم الشحن" },
];

export default function StepDiscount({ data, onChange }: StepDiscountProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">إعدادات العرض</h2>
      <p className="text-sm text-gray-500 mb-6">حدد نوع الخصم وتفاصيل الكوبون</p>

      {/* Discount type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {discountTypes.map((dt) => {
          const isSelected = data.discountType === dt.type;
          return (
            <button
              key={dt.type}
              type="button"
              onClick={() => onChange({ ...data, discountType: dt.type })}
              className={`text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-gray-800 bg-[#111827] hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-500"
                }`}>
                  {dt.icon}
                </div>
                <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-400"}`}>
                  {dt.label}
                </span>
              </div>
              <p className="text-xs text-gray-600">{dt.description}</p>
            </button>
          );
        })}
      </div>

      <div className="max-w-lg space-y-6">
        {/* Discount value */}
        {data.discountType !== "FREE_SHIPPING" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              قيمة الخصم
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={data.discountType === "PERCENTAGE" ? 100 : undefined}
                value={data.discountValue}
                onChange={(e) => onChange({ ...data, discountValue: Number(e.target.value) })}
                className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {data.discountType === "PERCENTAGE" ? "%" : "ر.س"}
              </span>
            </div>
            {data.discountType === "PERCENTAGE" && (
              <div className="flex gap-2 mt-3">
                {[5, 10, 15, 20, 25, 30].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange({ ...data, discountValue: v })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      data.discountValue === v
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-gray-800 text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Coupon prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">بادئة الكوبون</label>
          <p className="text-xs text-gray-600 mb-3">
            الكوبون النهائي بيكون مثلاً: <span className="font-mono text-emerald-400">{data.couponPrefix || "CODE"}-X7K2M</span>
          </p>
          <input
            type="text"
            maxLength={10}
            value={data.couponPrefix}
            onChange={(e) => onChange({ ...data, couponPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
            placeholder="مثال: BACK, VIP, WELCOME"
            className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-700"
            dir="ltr"
          />
        </div>

        {/* Coupon expiry */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">مدة صلاحية الكوبون</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { days: 1, label: "يوم" },
              { days: 3, label: "3 أيام" },
              { days: 7, label: "أسبوع" },
              { days: 14, label: "أسبوعين" },
            ].map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => onChange({ ...data, couponExpiryDays: opt.days })}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  data.couponExpiryDays === opt.days
                    ? "bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30"
                    : "bg-[#0B1120] text-gray-500 border-2 border-gray-800 hover:border-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
