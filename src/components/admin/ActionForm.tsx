"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/app/(admin)/admin/action-state";
import { CopyField } from "./CopyField";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submit: string;
  pendingText?: string;
  className?: string;
  /** نمط زر الإرسال */
  variant?: "primary" | "ghost";
  /** مسح الحقول بعد نجاح الإجراء (للنماذج التي تُنشئ سجلًا جديدًا) */
  resetOnSuccess?: boolean;
};

/**
 * نموذج عام لإجراءات الخادم: يعرض الخطأ/النجاح ورابط النسخ ويعطّل الزر أثناء الإرسال.
 * الإرسال يدوي داخل transition (وليس `action` مباشرة) لأن React 19 يمسح كل حقول النموذج بعد أي إجراء حتى عند الخطأ،
 * فيضطر المستخدم لإعادة كتابة كل شيء؛ هنا تبقى القيم عند الخطأ وتُمسح عند النجاح فقط إن طُلب.
 */
export function ActionForm({ action, children, submit, pendingText = "جارٍ الحفظ…", className = "space-y-5", variant = "primary", resetOnSuccess = false }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => {
          formAction(data);
        });
      }}
    >
      {children}
      <div aria-live="polite" className="space-y-3">
        {state.error && (
          <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <div role="status" className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <p>{state.message}</p>
            {state.link && <CopyField value={state.link} />}
          </div>
        )}
      </div>
      <button type="submit" disabled={pending} className={variant === "primary" ? "btn-primary" : "btn-ghost"}>
        {pending ? pendingText : submit}
      </button>
    </form>
  );
}
