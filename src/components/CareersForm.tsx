"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { availabilityOptions, genders, languages, nationalities, regions, staffRoles } from "@/lib/applications-shared";
import { CheckIcon } from "./icons";

type Errors = Record<string, string>;

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-2 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

const Check = ({ name, value, label }: { name: string; value: string; label: string }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand/10">
    <input type="checkbox" name={name} value={value} className="h-4 w-4 accent-[rgb(var(--brand))]" />{label}
  </label>
);
const Radio = ({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand/10">
    <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="h-4 w-4 accent-[rgb(var(--brand))]" />{label}
  </label>
);

export function CareersForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const year = new Date().getFullYear();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const local: Errors = {};
    if (!fd.getAll("roles").length) local.roles = "اختر دورًا واحدًا على الأقل";
    if (!fd.getAll("languages").length) local.languages = "اختر لغة واحدة على الأقل";
    if (fd.get("consent") !== "on") local.consent = "يجب الموافقة على سياسة الخصوصية";
    const cv = fd.get("cv");
    if (cv instanceof File && cv.size > 5 * 1024 * 1024) local.cv = "الحد الأقصى 5 م.ب";
    if (cv instanceof File && cv.size > 0 && cv.type !== "application/pdf") local.cv = "الصيغة المقبولة PDF فقط";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/careers", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setServerError(data.error ?? "تعذر إرسال الطلب، حاول مرة أخرى.");
        return;
      }
      setDone(data.reference);
    } catch {
      setServerError("تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center md:p-12" role="status">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-brand"><CheckIcon className="h-8 w-8" /></span>
        <h2 className="mt-6 text-3xl font-bold">تم استلام طلبك</h2>
        <p className="mt-4 text-muted">رقم طلبك — احتفظ به لمتابعة الحالة:</p>
        <p className="mt-2 font-display text-3xl font-bold text-brand" dir="ltr">{done}</p>
        <p className="mt-5 leading-8 text-muted">سيراجع فريقنا طلبك، وقد نطلب منك معلومات إضافية. تابع الحالة والملاحظات برقم الطلب ورقم جوالك.</p>
        <Link href={`/application-status?ref=${done}`} className="btn-primary mt-8">متابعة الطلب</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card mx-auto max-w-3xl space-y-8 p-6 md:p-10" aria-describedby={serverError ? "form-error" : undefined}>
      {/* حقل فخ للبوتات */}
      <div className="absolute -start-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>الموقع الإلكتروني<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <fieldset className="space-y-5">
        <legend className="mb-2 text-xl font-bold">البيانات الشخصية</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="fullName" label="الاسم الكامل" error={errors.fullName}>
            <input id="fullName" name="fullName" required minLength={3} maxLength={120} autoComplete="name" className="field" aria-invalid={!!errors.fullName} />
          </Field>
          <Field id="phone" label="رقم الجوال" error={errors.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="05XXXXXXXX" dir="ltr" className="field" aria-invalid={!!errors.phone} />
          </Field>
          <Field id="email" label="البريد الإلكتروني" error={errors.email}>
            <input id="email" name="email" type="email" required autoComplete="email" dir="ltr" className="field" aria-invalid={!!errors.email} />
          </Field>
          <Field id="city" label="المدينة" error={errors.city}>
            <select id="city" name="city" required defaultValue="riyadh" className="field">{regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
          </Field>
          <Field id="birthYear" label="سنة الميلاد" error={errors.birthYear}>
            <select id="birthYear" name="birthYear" required defaultValue={year - 25} className="field">
              {Array.from({ length: 49 }, (_, i) => year - 17 - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field id="experienceYears" label="سنوات الخبرة في الفعاليات" error={errors.experienceYears}>
            <input id="experienceYears" name="experienceYears" type="number" min={0} max={40} defaultValue={0} required dir="ltr" className="field" />
          </Field>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div role="radiogroup" aria-label="الجنس">
            <p className="label">الجنس</p>
            <div className="grid grid-cols-2 gap-3">{genders.map((g, i) => <Radio key={g.id} name="gender" value={g.id} label={g.label} defaultChecked={i === 0} />)}</div>
            {errors.gender && <p role="alert" className="mt-2 text-sm text-danger">{errors.gender}</p>}
          </div>
          <div role="radiogroup" aria-label="الجنسية">
            <p className="label">الجنسية</p>
            <div className="grid grid-cols-2 gap-3">{nationalities.map((n, i) => <Radio key={n.id} name="nationality" value={n.id} label={n.label} defaultChecked={i === 0} />)}</div>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-2 text-xl font-bold">الأدوار والتفرغ</legend>
        <div>
          <p className="label">الأدوار التي ترغب بالعمل بها</p>
          <div className="grid gap-3 sm:grid-cols-2">{staffRoles.map((r) => <Check key={r.id} name="roles" value={r.id} label={r.label} />)}</div>
          {errors.roles && <p role="alert" className="mt-2 text-sm text-danger">{errors.roles}</p>}
        </div>
        <div>
          <p className="label">اللغات</p>
          <div className="grid gap-3 sm:grid-cols-3">{languages.map((l) => <Check key={l.id} name="languages" value={l.id} label={l.label} />)}</div>
          {errors.languages && <p role="alert" className="mt-2 text-sm text-danger">{errors.languages}</p>}
        </div>
        <div role="radiogroup" aria-label="التفرغ">
          <p className="label">التفرغ</p>
          <div className="grid gap-3 sm:grid-cols-2">{availabilityOptions.map((a, i) => <Radio key={a.id} name="availability" value={a.id} label={a.label} defaultChecked={i === 3} />)}</div>
        </div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="hasTransport" className="h-4 w-4 accent-[rgb(var(--brand))]" />لدي وسيلة نقل خاصة</label>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-2 text-xl font-bold">نبذة والسيرة الذاتية</legend>
        <Field id="about" label="نبذة عنك وخبراتك السابقة (اختياري)" error={errors.about}>
          <textarea id="about" name="about" rows={4} maxLength={1000} className="field" />
        </Field>
        <Field id="cv" label="السيرة الذاتية (PDF، اختياري، حتى 5 م.ب)" error={errors.cv}>
          <input id="cv" name="cv" type="file" accept="application/pdf" className="field file:me-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-bg" />
        </Field>
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-sm leading-7">
          <input type="checkbox" name="consent" required className="mt-2 h-4 w-4 accent-[rgb(var(--brand))]" aria-invalid={!!errors.consent} />
          <span>
            أوافق على معالجة بياناتي لغرض دراسة طلبي والتواصل معي وفق <Link href="/privacy" className="text-brand underline" target="_blank">سياسة الخصوصية</Link>، وأعلم أن بياناتي لا يصل إليها إلا فريق مخوَّل.
          </span>
        </label>
        {errors.consent && <p role="alert" className="mt-2 text-sm text-danger">{errors.consent}</p>}
      </div>

      {serverError && <p id="form-error" role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{serverError}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base">{submitting ? "جارٍ الإرسال…" : "إرسال الطلب"}</button>
    </form>
  );
}
