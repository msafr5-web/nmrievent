"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { galleryCategories } from "@/content/gallery";
import { services } from "@/content/services";

/** رفع صورة جديدة إلى معرض الموقع: معاينة فورية، ثم إرسال multipart إلى /api/admin/gallery */
export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFileError("");
    setDone(false);
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) return setFileError("اختر صورة للرفع.");
    if (file.size > 10 * 1024 * 1024) return setFileError("حجم الصورة أكبر من 10 م.ب.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: data, credentials: "same-origin" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.fields?.file) setFileError(json.fields.file);
        setError(json.fields?.alt ?? json.fields?.category ?? json.error ?? "تعذر رفع الصورة.");
        return;
      }
      form.reset();
      setPreview(null);
      setDone(true);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card space-y-5 p-6" aria-labelledby="upload-title">
      <h2 id="upload-title" className="text-xl font-bold">إضافة صورة جديدة</h2>
      <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
        <div>
          <label htmlFor="file" className="label">الصورة (JPG / PNG / WebP — حتى 10 م.ب)</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field file:me-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-bg"
            aria-invalid={!!fileError}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
              setFileError("");
            }}
          />
          {fileError && <p className="mt-2 text-sm text-danger" role="alert">{fileError}</p>}
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- معاينة محلية (blob) قبل الرفع
            <img src={preview} alt="معاينة الصورة المختارة" className="mt-3 max-h-48 w-full rounded-2xl border border-line object-contain" />
          )}
          <p className="mt-3 text-xs leading-6 text-muted">تُحوَّل الصورة تلقائيًا إلى WebP بعرض أقصى 1600px وتُزال بيانات الموقع (EXIF) منها قبل النشر.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="category" className="label">التصنيف</label>
            <select id="category" name="category" required defaultValue="booths" className="field">
              {galleryCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="alt" className="label">الوصف (يظهر عند التكبير وللقراء الآليين)</label>
            <input id="alt" name="alt" required minLength={5} maxLength={200} placeholder="مثال: جناح شركة … في معرض …" className="field" />
          </div>
          <fieldset>
            <legend className="label">تظهر أيضًا في صفحات الخدمات</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {services.map((s) => (
                <label key={s.slug} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="services" value={s.slug} className="h-4 w-4 accent-[rgb(var(--brand))]" />{s.title}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="visible" defaultChecked className="h-4 w-4 accent-[rgb(var(--brand))]" />ظاهرة في الموقع</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" className="h-4 w-4 accent-[rgb(var(--brand))]" />تظهر في الصفحة الرئيسية</label>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {done && <p role="status" className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">تمت إضافة الصورة وستظهر في الموقع خلال لحظات.</p>}
      <button type="submit" disabled={busy} className="btn-primary">{busy ? "جارٍ الرفع…" : "رفع الصورة"}</button>
    </form>
  );
}
