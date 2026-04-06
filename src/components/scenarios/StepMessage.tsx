"use client";

import { useRef } from "react";
import type { Channel } from "@/types";

export interface MessageData {
  channel: Channel;
  messageTemplate: string;
}

interface StepMessageProps {
  data: MessageData;
  onChange: (data: MessageData) => void;
  previewValues: {
    customerName: string;
    couponCode: string;
    discountValue: string;
    productName: string;
  };
}

const channels: { type: Channel; label: string; icon: string; color: string }[] = [
  { type: "WHATSAPP", label: "واتساب", icon: "💬", color: "emerald" },
  { type: "SMS", label: "رسالة نصية", icon: "📱", color: "cyan" },
  { type: "EMAIL", label: "بريد إلكتروني", icon: "📧", color: "violet" },
];

const variables = [
  { key: "{اسم_العميل}", label: "اسم العميل", icon: "👤" },
  { key: "{الكوبون}", label: "الكوبون", icon: "🏷️" },
  { key: "{قيمة_الخصم}", label: "قيمة الخصم", icon: "💰" },
  { key: "{اسم_المنتج}", label: "اسم المنتج", icon: "📦" },
];

export default function StepMessage({ data, onChange, previewValues }: StepMessageProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = data.messageTemplate;
    const newText = text.slice(0, start) + variable + text.slice(end);
    onChange({ ...data, messageTemplate: newText });

    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + variable.length;
    });
  }

  function getPreview() {
    return data.messageTemplate
      .replace(/{اسم_العميل}/g, previewValues.customerName)
      .replace(/{الكوبون}/g, previewValues.couponCode)
      .replace(/{قيمة_الخصم}/g, previewValues.discountValue)
      .replace(/{اسم_المنتج}/g, previewValues.productName);
  }

  const channelColors: Record<string, string> = {
    emerald: "border-emerald-500/50 bg-emerald-500/5",
    cyan: "border-cyan-500/50 bg-cyan-500/5",
    violet: "border-violet-500/50 bg-violet-500/5",
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">الرسالة والقناة</h2>
      <p className="text-sm text-gray-500 mb-6">اختر طريقة التواصل واكتب رسالتك</p>

      {/* Channel selection */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {channels.map((ch) => {
          const isSelected = data.channel === ch.type;
          return (
            <button
              key={ch.type}
              type="button"
              onClick={() => onChange({ ...data, channel: ch.type })}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                isSelected ? channelColors[ch.color] : "border-gray-800 bg-[#111827] hover:border-gray-700"
              }`}
            >
              <span className="text-2xl block mb-2">{ch.icon}</span>
              <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-500"}`}>
                {ch.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message editor */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">نص الرسالة</label>

          {/* Variables */}
          <div className="flex flex-wrap gap-2 mb-3">
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1120] border border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-lg text-xs text-gray-400 hover:text-emerald-400 transition-all"
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={data.messageTemplate}
            onChange={(e) => onChange({ ...data, messageTemplate: e.target.value })}
            rows={8}
            placeholder="اكتب رسالتك هنا... استخدم الأزرار أعلاه لإدراج المتغيرات"
            className="w-full bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white leading-relaxed resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-700"
          />
          <p className="text-xs text-gray-600 mt-2">
            {data.messageTemplate.length} حرف
          </p>
        </div>

        {/* Live preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">معاينة حية</label>

          <div className="bg-[#0B1120] border border-gray-800 rounded-xl overflow-hidden">
            {/* Phone header */}
            <div className="bg-[#111827] px-4 py-3 flex items-center gap-3 border-b border-gray-800">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-xs">
                  {data.channel === "WHATSAPP" ? "💬" : data.channel === "SMS" ? "📱" : "📧"}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">متجر النخبة</p>
                <p className="text-[10px] text-gray-600">
                  {data.channel === "WHATSAPP" ? "واتساب بزنس" : data.channel === "SMS" ? "رسالة نصية" : "بريد إلكتروني"}
                </p>
              </div>
            </div>

            {/* Message bubble */}
            <div className="p-4">
              {data.messageTemplate ? (
                <div className="bg-[#1A2235] rounded-2xl rounded-tr-sm p-4 max-w-[90%]">
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {getPreview()}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-2 text-left">10:30 ص ✓✓</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-600">اكتب رسالتك لتظهر المعاينة هنا</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
