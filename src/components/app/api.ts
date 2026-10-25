/** استدعاء واجهات المنصة من المكونات التفاعلية مع توحيد رسائل الخطأ */
export async function api<T = Record<string, unknown>>(url: string, method: string, body?: unknown) {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false as const, error: (data.error as string) ?? "حدث خطأ غير متوقع.", fields: (data.fields ?? {}) as Record<string, string> };
    return { ok: true as const, data: data as T };
  } catch {
    return { ok: false as const, error: "تعذر الاتصال بالخادم.", fields: {} as Record<string, string> };
  }
}
