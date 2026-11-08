import { PERMISSIONS } from "@/lib/permissions";

/** خانات الصلاحيات مجمَّعة حسب القسم؛ `checked` قائمة الصلاحيات المحددة مسبقًا */
export function PermissionBoxes({ checked = [] }: { checked?: readonly string[] }) {
  const groups = [...new Set(PERMISSIONS.map((p) => p.group))];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <fieldset key={g} className="rounded-2xl border border-line p-4">
          <legend className="px-2 text-sm font-semibold">{g}</legend>
          <div className="space-y-2">
            {PERMISSIONS.filter((p) => p.group === g).map((p) => (
              <label key={p.key} className="flex items-start gap-3 text-sm leading-6">
                <input type="checkbox" name="permissions" value={p.key} defaultChecked={checked.includes(p.key)} className="mt-1.5 h-4 w-4 accent-[rgb(var(--brand))]" />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
