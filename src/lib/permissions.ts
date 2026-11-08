/**
 * نموذج الصلاحيات (RBAC). المدير الأعلى (البريد المضبوط في SUPER_ADMIN_EMAIL) يملك كل شيء ضمنيًا،
 * وهو وحده من يدير المستخدمين ويمنح الصلاحيات (`users.manage` لا تُمنح لغيره).
 * ملف نقي (بدون خادم/قاعدة) ليُستخدم في الواجهة والخادم والاختبارات.
 */

export const PERMISSIONS = [
  { key: "gallery.view", label: "عرض معرض الصور", group: "معرض الصور" },
  { key: "gallery.create", label: "رفع صور جديدة", group: "معرض الصور" },
  { key: "gallery.edit", label: "تعديل الصور (الوصف، التصنيف، الترتيب، الإخفاء)", group: "معرض الصور" },
  { key: "gallery.delete", label: "حذف الصور", group: "معرض الصور" },
  { key: "staff.view", label: "عرض طلبات التوظيف", group: "طلبات التوظيف" },
  { key: "staff.review", label: "مراجعة طلبات التوظيف (قبول/رفض/ملاحظات)", group: "طلبات التوظيف" },
  { key: "staff.delete", label: "حذف طلبات التوظيف", group: "طلبات التوظيف" },
  { key: "exhibitions.view", label: "عرض طلبات المعارض", group: "طلبات المعارض" },
  { key: "exhibitions.review", label: "مراجعة طلبات المعارض (قبول/رفض/ملاحظات)", group: "طلبات المعارض" },
  { key: "exhibitions.delete", label: "حذف طلبات المعارض", group: "طلبات المعارض" },
  { key: "rfq.view", label: "عرض طلبات عروض الأسعار", group: "أخرى" },
  { key: "audit.view", label: "عرض سجل النشاط", group: "أخرى" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
/** صلاحية لا تُمنح لأحد غير المدير الأعلى */
export type SuperOnly = "users.manage";
export type AnyPermission = Permission | SuperOnly;

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSIONS.map((p) => p.key);
const VALID = new Set<string>(ALL_PERMISSIONS);

/** صلاحيات تتضمن ضمنيًا صلاحية العرض في قسمها */
const IMPLIES_VIEW: Record<string, Permission> = {
  "gallery.create": "gallery.view",
  "gallery.edit": "gallery.view",
  "gallery.delete": "gallery.view",
  "staff.review": "staff.view",
  "staff.delete": "staff.view",
  "exhibitions.review": "exhibitions.view",
  "exhibitions.delete": "exhibitions.view",
};

export type PermissionSubject = { isSuper: boolean; permissions: readonly string[] };

export function hasPermission(user: PermissionSubject | null | undefined, perm: AnyPermission): boolean {
  if (!user) return false;
  if (perm === "users.manage") return user.isSuper;
  return user.isSuper || user.permissions.includes(perm);
}

/** ينظّف قائمة صلاحيات واردة من نموذج: يحذف المجهول والمكرر و`users.manage`، ويضيف صلاحيات العرض الضمنية */
export function sanitizePermissions(input: readonly string[]): Permission[] {
  const set = new Set<Permission>();
  for (const p of input) {
    if (!VALID.has(p)) continue;
    set.add(p as Permission);
    const implied = IMPLIES_VIEW[p];
    if (implied) set.add(implied);
  }
  return ALL_PERMISSIONS.filter((p) => set.has(p));
}

export const PRESETS: { id: string; label: string; description: string; permissions: Permission[] }[] = [
  { id: "viewer", label: "مشاهد", description: "اطلاع فقط على كل الأقسام دون تعديل.", permissions: ["gallery.view", "staff.view", "exhibitions.view", "rfq.view"] },
  { id: "gallery-editor", label: "محرر المعرض", description: "رفع الصور وتعديلها وإخفاؤها.", permissions: ["gallery.view", "gallery.create", "gallery.edit"] },
  { id: "hr-reviewer", label: "مراجع توظيف", description: "مراجعة طلبات التوظيف وإرسال الملاحظات.", permissions: ["staff.view", "staff.review"] },
  { id: "exhibitions-reviewer", label: "مراجع معارض", description: "مراجعة طلبات المشاركة في المعارض.", permissions: ["exhibitions.view", "exhibitions.review"] },
  {
    id: "manager",
    label: "مدير عمليات",
    description: "كل شيء عدا الحذف النهائي وإدارة المستخدمين.",
    permissions: ["gallery.view", "gallery.create", "gallery.edit", "staff.view", "staff.review", "exhibitions.view", "exhibitions.review", "rfq.view", "audit.view"],
  },
];

export const permissionLabel = (p: string) => PERMISSIONS.find((x) => x.key === p)?.label ?? p;

/** صلاحية قسم الطلبات حسب نوع الطلب والعملية */
export function applicationPermission(kind: "staff" | "exhibition", action: "view" | "review" | "delete"): Permission {
  return `${kind === "staff" ? "staff" : "exhibitions"}.${action}` as Permission;
}

/** مقطع المسار في لوحة التحكم لكل نوع طلب */
export const applicationSegment = (kind: "staff" | "exhibition") => (kind === "staff" ? "staff" : "exhibitions");
