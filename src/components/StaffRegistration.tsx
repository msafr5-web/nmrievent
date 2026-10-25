"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "./app/api";
import { QrImage } from "./app/QrImage";
import { CheckIcon, MailIcon } from "./icons";

const levels = ["الثانوية العامة", "دبلوم", "بكالوريوس", "دراسات عليا"];
type Form = { name: string; phone: string; education: string; email: string };
type Staff = Form & { id: string };

/** بوابة تسجيل الكوادر الميدانية: بيانات ← رمز تحقق OTP ← بطاقة QR (وفق دليل التنفيذ) */
export function StaffRegistration() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<Form>({ name: "", phone: "", education: "", email: "" });
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [result, setResult] = useState<{ staff: Staff; qr: string } | null>(null);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!consent) return setErrors({ consent: "يجب الموافقة على سياسة الخصوصية" });
    setBusy(true);
    setError("");
    const r = await api<{ demoCode?: string }>("/api/staff/otp", "POST", form);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields);
      return setError(r.error);
    }
    setDemoCode(r.data.demoCode ?? null);
    setOtp("");
    setStep(2);
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api<{ staff: Staff; qr: string }>("/api/staff/verify", "POST", { email: form.email, otp });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setResult(r.data);
    setStep(3);
  };

  const reset = () => {
    setForm({ name: "", phone: "", education: "", email: "" });
    setConsent(false);
    setResult(null);
    setDemoCode(null);
    setStep(1);
  };

  return (
    <div className="card mx-auto max-w-2xl p-6 md:p-10">
      <ol className="mb-8 grid grid-cols-3 gap-2 text-center text-xs" aria-label="مراحل التسجيل">
        {["البيانات", "رمز التحقق", "بطاقة QR"].map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${step > i ? "bg-gold" : "bg-line"}`} />
            <span className={`mt-2 block ${step === i + 1 ? "font-semibold text-fg" : "text-muted"}`}>{s}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form onSubmit={sendOtp} noValidate className="space-y-6">
          <Field id="name" label="الاسم الكامل ثلاثي" error={errors.name}>
            <input id="name" className="field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثال: عبد الله بن محمد العتيبي" autoComplete="name" required />
          </Field>
          <div className="grid gap-6 md:grid-cols-2">
            <Field id="phone" label="رقم الجوال (السعودي)" error={errors.phone}>
              <input id="phone" type="tel" dir="ltr" className="field text-right" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05xxxxxxxx" autoComplete="tel" required />
            </Field>
            <Field id="education" label="المستوى التعليمي" error={errors.education}>
              <select id="education" className="field" value={form.education} onChange={(e) => set("education", e.target.value)} required>
                <option value="">اختر المستوى التعليمي</option>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field id="email" label="البريد الإلكتروني" error={errors.email}>
            <input id="email" type="email" dir="ltr" className="field text-right" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" autoComplete="email" required />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-7">
            <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((x) => ({ ...x, consent: "" })); }} className="mt-1.5 h-4 w-4 accent-[rgb(var(--gold))]" />
            <span>أوافق على حفظ بياناتي في قاعدة كوادر nmrievent وفق <Link href="/privacy" className="text-gold underline">سياسة الخصوصية</Link> ونظام حماية البيانات الشخصية.</span>
          </label>
          {errors.consent && <p className="text-sm text-clay">{errors.consent}</p>}
          {error && <p className="rounded-2xl bg-clay/10 p-4 text-sm text-clay" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full py-4 text-base" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال رمز التحقق OTP"}</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verify} className="space-y-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/10 text-gold"><MailIcon className="h-8 w-8" /></span>
          <div>
            <h2 className="text-xl font-bold">التحقق من البريد الإلكتروني</h2>
            <p className="mt-2 text-sm text-muted">أرسلنا رمز تحقق من 4 أرقام إلى <span className="font-semibold text-gold" dir="ltr">{form.email}</span>، وصلاحيته 10 دقائق.</p>
          </div>
          {demoCode && (
            <p className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-sm">
              وضع العرض التجريبي (لا يوجد مزود بريد مفعّل): الرمز هو <strong className="font-display text-gold" dir="ltr">{demoCode}</strong>
            </p>
          )}
          <label htmlFor="otp" className="sr-only">رمز التحقق</label>
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••" dir="ltr" className="field mx-auto max-w-xs py-4 text-center font-display text-3xl tracking-[0.5em] text-gold" required />
          {error && <p className="rounded-2xl bg-clay/10 p-4 text-sm text-clay" role="alert">{error}</p>}
          <div className="flex gap-3">
            <button type="button" className="btn-ghost flex-1" onClick={() => { setStep(1); setError(""); }}>رجوع</button>
            <button type="submit" className="btn-primary flex-1" disabled={busy || otp.length !== 4}>{busy ? "جارٍ التحقق..." : "تأكيد وانضمام"}</button>
          </div>
          <button type="button" className="text-sm text-muted underline hover:text-gold" onClick={() => sendOtp()} disabled={busy}>إعادة إرسال الرمز</button>
        </form>
      )}

      {step === 3 && result && (
        <div className="space-y-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-palm/15 text-palm"><CheckIcon className="h-8 w-8" /></span>
          <div>
            <h2 className="text-2xl font-bold text-palm">تم تسجيلك بنجاح في قاعدة بيانات nmrievent</h2>
            <p className="mt-2 text-sm text-muted">هذه بطاقتك الرقمية. احتفظ بها، وستصلك بطاقة تحضير خاصة بكل فعالية عند إسنادك لها.</p>
          </div>
          <div className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-line bg-elevated p-6">
            <QrImage value={result.qr} label={`رمز QR للموظف ${result.staff.name}`} />
            <h3 className="mt-4 text-lg font-bold">{result.staff.name}</h3>
            <p className="text-xs font-semibold text-gold">{result.staff.education}</p>
            <p className="mt-1 text-xs text-muted" dir="ltr">{result.staff.phone}</p>
            <p className="mt-3 font-mono text-[10px] text-muted" dir="ltr">{result.staff.id}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-ghost" onClick={() => window.print()}>طباعة البطاقة</button>
            <button type="button" className="btn-ghost" onClick={reset}>تسجيل موظف جديد</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  );
}
