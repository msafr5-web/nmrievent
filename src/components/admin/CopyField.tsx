"use client";

import { useState } from "react";

/** حقل للقراءة فقط مع زر نسخ (لروابط الدعوة وإعادة التعيين) */
export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row" dir="ltr">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="field flex-1 font-mono text-xs" aria-label="الرابط" />
      <button
        type="button"
        className="btn-ghost shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* المتصفح قد يمنع الحافظة؛ يمكن نسخ النص يدويًا */
          }
        }}
      >
        {copied ? "تم النسخ ✓" : "نسخ الرابط"}
      </button>
    </div>
  );
}
