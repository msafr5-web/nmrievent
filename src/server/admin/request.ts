/** مساعدات طلبات نقية (بدون next/headers) لتُختبر بسهولة */

type HeaderGetter = { get(name: string): string | null };

/** عنوان العميل: x-real-ip (يضبطه Caddy) ثم أول عنصر في x-forwarded-for */
export function ipFromHeaders(h: HeaderGetter): string | null {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/**
 * حماية CSRF لمسارات الـ API التي تغيّر الحالة: يجب أن يحمل الطلب ترويسة Origin تطابق المضيف.
 * (إجراءات الخادم في Next تفعل هذا الفحص تلقائيًا؛ هذه الدالة لمسارات route handlers.)
 */
export function isSameOrigin(h: HeaderGetter): boolean {
  const origin = h.get("origin");
  if (!origin) return false;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** أساس الروابط المطلقة (للدعوات ورسائل واتساب) من ترويسات الطلب مع احتياطي عنوان الموقع */
export function originFromHeaders(h: HeaderGetter, fallback: string): string {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return fallback.replace(/\/$/, "");
  const proto = h.get("x-forwarded-proto") ?? (fallback.startsWith("https://") ? "https" : "http");
  return `${proto.split(",")[0].trim()}://${host}`;
}
