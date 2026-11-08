"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { boothTypes, exhibitionServices, exhibitorSectors, regions } from "@/lib/applications-shared";
import { budgetLabels, type Budget } from "@/lib/rfq-shared";
import { CheckIcon } from "./icons";

type Errors = Record<string, string>;

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function ExhibitionApplyForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    const fd = new FormData(e.currentTarget);
    const local: Errors = {};
    if (!fd.getAll("services").length) local.services = "اختر خدمة واحدة على الأقل";
    if (fd.get("consent") !== "on") local.consent = "يجب الموافقة على سياسة الخصوصية";
    setErrors(local);
    if (Object.keys(local).length) return;

    const body = {
      organization: fd.get("organization"),
      contactName: fd.get("contactName"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      city: fd.get("city"),
      crNumber: fd.get("crNumber") || undefined,
      sector: fd.get("sector"),
      exhibitionName: fd.get("exhibitionName"),
      exhibitionDates: fd.get("exhibitionDates") ?? "",
      boothSize: fd.get("boothSize"),
      boothType: fd.get("boothType"),
      services: fd.getAll("services"),
      budget: fd.get("budget"),
      details: fd.get("details") ?? "",
      consent: fd.get("consent") === "on",
      company_site: fd.get("company_site") ?? undefined,
    };
    setSubmitting(true);
    try {
      const res = await fetch("/api/exhibitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
        <p className="mt-5 leading-8 text-muted">سيراجع فريق المعارض طلبك ويتواصل معك. تابع الحالة والملاحظات برقم الطلب ورقم جوالك.</p>
        <Link href={`/application-status?ref=${done}`} className="btn-primary mt-8">متابعة الطلب</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card mx-auto max-w-3xl space-y-8 p-6 md:p-10">
      <div className="absolute -start-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>الموقع الإلكتروني<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <fieldset className="space-y-5">
        <legend className="mb-2 text-xl font-bold">بيانات الجهة</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="organization" label="اسم الجهة / الشركة" error={errors.organization}><input id="organization" name="organization" required minLength={2} maxLength={160} autoComplete="organization" className="field" /></Field>
          <Field id="crNumber" label="رقم السجل التجاري (اختياري)" error={errors.crNumber}><input id="crNumber" name="crNumber" inputMode="numeric" pattern="\d{10}" maxLength={10} dir="ltr" className="field" /></Field>
          <Field id="contactName" label="اسم المسؤول" error={errors.contactName}><input id="contactName" name="contactName" required minLength={3} maxLength={120} autoComplete="name" className="field" /></Field>
          <Field id="phone" label="رقم الجوال" error={errors.phone}><input id="phone" name="phone" type="tel" required placeholder="05XXXXXXXX" dir="ltr" autoComplete="tel" className="field" /></Field>
          <Field id="email" label="البريد الإلكتروني" error={errors.email}><input id="email" name="email" type="email" required dir="ltr" autoComplete="email" className="field" /></Field>
          <Field id="city" label="المدينة" error={errors.city}><select id="city" name="city" defaultValue="riyadh" className="field">{regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></Field>
          <Field id="sector" label="القطاع" error={errors.sector}><select id="sector" name="sector" defaultValue={exhibitorSectors[1]} className="field">{exhibitorSectors.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-2 text-xl font-bold">تفاصيل المشاركة</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="exhibitionName" label="اسم المعرض" error={errors.exhibitionName}><input id="exhibitionName" name="exhibitionName" required minLength={3} maxLength={160} className="field" /></Field>
          <Field id="exhibitionDates" label="تواريخ المعرض (اختياري)" error={errors.exhibitionDates}><input id="exhibitionDates" name="exhibitionDates" maxLength={80} placeholder="مثال: 12 – 15 مارس 2027" className="field" /></Field>
          <Field id="boothSize" label="مساحة الجناح (م²)" error={errors.boothSize}><input id="boothSize" name="boothSize" type="number" min={3} max={5000} defaultValue={24} required dir="ltr" className="field" /></Field>
          <Field id="boothType" label="نوع الجناح" error={errors.boothType}><select id="boothType" name="boothType" defaultValue="custom" className="field">{boothTypes.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></Field>
          <Field id="budget" label="الميزانية التقديرية" error={errors.budget}>
            <select id="budget" name="budget" defaultValue="undecided" className="field">{(Object.keys(budgetLabels) as Budget[]).map((b) => <option key={b} value={b}>{budgetLabels[b]}</option>)}</select>
          </Field>
        </div>
        <div>
          <p className="label">الخدمات المطلوبة</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {exhibitionServices.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand/10">
                <input type="checkbox" name="services" value={s.id} className="h-4 w-4 accent-[rgb(var(--brand))]" />{s.label}
              </label>
            ))}
          </div>
          {errors.services && <p role="alert" className="mt-2 text-sm text-danger">{errors.services}</p>}
        </div>
        <Field id="details" label="تفاصيل إضافية (اختياري)" error={errors.details}><textarea id="details" name="details" rows={4} maxLength={2000} className="field" /></Field>
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-sm leading-7">
          <input type="checkbox" name="consent" required className="mt-2 h-4 w-4 accent-[rgb(var(--brand))]" />
          <span>أوافق على معالجة بياناتي لغرض دراسة الطلب والتواصل معي وفق <Link href="/privacy" className="text-brand underline" target="_blank">سياسة الخصوصية</Link>.</span>
        </label>
        {errors.consent && <p role="alert" className="mt-2 text-sm text-danger">{errors.consent}</p>}
      </div>

      {serverError && <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{serverError}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base">{submitting ? "جارٍ الإرسال…" : "إرسال الطلب"}</button>
    </form>
  );
}
