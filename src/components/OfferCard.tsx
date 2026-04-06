import type { Offer } from "@/types";
import { formatCurrency, formatDate, getOfferTypeLabel } from "@/lib/utils";

interface OfferCardProps {
  offer: Offer;
}

export default function OfferCard({ offer }: OfferCardProps) {
  const isExpired = offer.endsAt && new Date(offer.endsAt) < new Date();
  const statusLabel = !offer.isActive
    ? "معطّل"
    : isExpired
      ? "منتهي"
      : "نشط";
  const statusColor = !offer.isActive
    ? "bg-gray-100 text-gray-600"
    : isExpired
      ? "bg-red-100 text-red-600"
      : "bg-emerald-100 text-emerald-600";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{offer.name}</h3>
          {offer.description && (
            <p className="text-sm text-gray-500 mt-1">{offer.description}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">النوع:</span>
          <span className="font-medium mr-1">{getOfferTypeLabel(offer.type)}</span>
        </div>
        <div>
          <span className="text-gray-500">القيمة:</span>
          <span className="font-medium mr-1">
            {offer.type === "PERCENTAGE" ? `${offer.value}%` : formatCurrency(offer.value)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">تاريخ البدء:</span>
          <span className="font-medium mr-1">{formatDate(offer.startsAt)}</span>
        </div>
        <div>
          <span className="text-gray-500">الاستخدام:</span>
          <span className="font-medium mr-1">
            {offer.usageCount}
            {offer.usageLimit ? ` / ${offer.usageLimit}` : ""}
          </span>
        </div>
      </div>

      {offer.code && (
        <div className="mt-4 bg-gray-50 rounded-lg px-4 py-2 text-center">
          <span className="text-xs text-gray-500">كود الخصم:</span>
          <span className="font-mono font-bold text-emerald-600 mr-2">
            {offer.code}
          </span>
        </div>
      )}
    </div>
  );
}
