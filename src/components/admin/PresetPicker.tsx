"use client";

import { PRESETS, PERMISSIONS } from "@/lib/permissions";

/** أزرار قوالب جاهزة تحدد خانات الصلاحيات (حقول name="permissions") في أقرب نموذج، ويمكن تعديلها يدويًا بعدها */
export function PresetPicker() {
  const apply = (e: React.MouseEvent<HTMLButtonElement>, ids: readonly string[]) => {
    const form = e.currentTarget.closest("form");
    if (!form) return;
    for (const box of form.querySelectorAll<HTMLInputElement>('input[name="permissions"]')) box.checked = ids.includes(box.value);
  };
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="قوالب الصلاحيات">
      {PRESETS.map((p) => (
        <button key={p.id} type="button" title={p.description} onClick={(e) => apply(e, p.permissions)} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand">
          {p.label}
        </button>
      ))}
      <button type="button" onClick={(e) => apply(e, [])} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-danger hover:text-danger">
        مسح الكل
      </button>
      <span className="sr-only">{PERMISSIONS.length} صلاحية</span>
    </div>
  );
}
