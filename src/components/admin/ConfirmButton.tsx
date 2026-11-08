"use client";

import type { ReactNode } from "react";

/** زر إرسال يطلب تأكيدًا قبل العمليات المدمّرة (الحذف) */
export function ConfirmButton({ message, children, className = "btn-ghost text-danger" }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
