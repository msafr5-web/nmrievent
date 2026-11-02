"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { site } from "@/content/site";
import {
  addOns,
  cities,
  estimate,
  eventKinds,
  formatSAR,
  tiers,
  type AddOnId,
  type CityId,
  type EventKindId,
  type TierId,
} from "@/lib/estimator";
import { budgetLabels, venueLabels, whatsappLink, type Budget, type VenueStatus } from "@/lib/rfq-shared";
import { ArrowIcon, CheckIcon, WhatsAppIcon } from "./icons";

const steps = ["نوع الفعالية", "الحجم والموقع", "الخدمات", "التفاصيل", "بيانات التواصل"] as const;

const serviceToAddOns: Record<string, AddOnId[]> = {
  creative: ["creative"],
  tech: ["hologram", "registration"],
  logistics: ["transport"],
  staffing: ["staffing"],
  crowd: ["crowd"],
};

type Form = {
  kind: EventKindId;
  tier: TierId;
  guests: number;
  days: number;
  city: CityId;
  addOns: AddOnId[];
  date: string;
  venueStatus: VenueStatus;
  budget: Budget;
  goals: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  consent: boolean;
  company_site: string;
};

type Errors = Partial<Record<keyof Form, string>>;
type Done = { reference: string; estimate: { low: number; high: number } };

export function RfqConfigurator() {
  const params = useSearchParams();
  const preset = serviceToAddOns[params.get("service") ?? ""] ?? [];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    kind: "conference",
    tier: "premium",
    guests: 500,
    days: 2,
    city: "riyadh",
    addOns: preset,
    date: "",
    venueStatus: "searching",
    budget: "undecided",
    goals: "",
    name: "",
    organization: "",
    email: "",
    phone: "",
    consent: false,
    company_site: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const est = useMemo(
    () => estimate({ kind: form.kind, tier: form.tier, guests: form.guests, days: form.days, city: form.city, addOns: form.addOns }),
    [form.kind, form.tier, form.guests, form.days, form.city, form.addOns],
  );

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const toggleAddOn = (id: AddOnId) =>
    set("addOns", form.addOns.includes(id) ? form.addOns.filter((a) => a !== id) : [...form.addOns, id]);

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 1) {
      if (!Number.isFinite(form.guests) || form.guests < 10) e.guests = "الحد الأدنى 10 حضور";
      if (form.days < 1 || form.days > 30) e.days = "من يوم إلى 30 يومًا";
    }
    if (s === 3 && !form.date) e.date = "حدد التاريخ المتوقع";
    if (s === 4) {
      if (form.name.trim().length < 2) e.name = "الاسم مطلوب";
      if (form.organization.trim().length < 2) e.organization = "اسم الجهة مطلوب";
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "بريد إلكتروني غير صالح";
      if (!/^(\+?966|0)?5\d{8}$/.test(form.phone.replace(/[\s-]/g, ""))) e.phone = "رقم جوال سعودي غير صالح (مثال: 05XXXXXXXX)";
      if (!form.consent) e.consent = "يجب الموافقة على سياسة الخصوصية";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep((s) => Math.min(steps.length - 1, s + 1));
      document.getElementById("rfq-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (step < steps.length - 1) return next();
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone.replace(/[\s-]/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "تعذر إرسال الطلب، حاول مرة أخرى.");
        if (data.fields) setErrors(data.fields);
        return;
      }
      setDone(data);
    } catch {
      setServerError("تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.");
    } finally {
      setSubmitting(false);
    }
  };

  const kindLabel = eventKinds.find((k) => k.id === form.kind)!.label;
  const cityLabel = cities.find((c) => c.id === form.city)!.label;

  if (done) {
    const msg = `مرحبًا nmrievent، رقم طلبي ${done.reference}.\nنوع الفعالية: ${kindLabel}\nالحضور: ${form.guests}\nالمدينة: ${cityLabel}\nالتاريخ: ${form.date}`;
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center md:p-14" role="status">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold text-bg"><CheckIcon className="h-8 w-8" /></span>
        <h2 className="mt-6 text-3xl font-bold">استلمنا طلبك بنجاح</h2>
        <p className="mt-4 leading-8 text-muted">
          رقم الطلب <strong className="font-display text-gold" dir="ltr">{done.reference}</strong>. احتفظ به للمتابعة، وسيتواصل معك مستشار الفعاليات خلال ساعتين في أوقات العمل.
        </p>
        <p className="mt-6 rounded-2xl bg-elevated p-5 text-sm">
          التقدير المبدئي: <strong className="text-gold">{formatSAR(done.estimate.low)} – {formatSAR(done.estimate.high)}</strong>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink(site.whatsapp, msg)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:opacity-90">
            <WhatsAppIcon className="h-5 w-5" /> تابع طلبك عبر واتساب
          </a>
          <Link href="/portfolio" className="btn-ghost">تصفح أعمالنا</Link>
        </div>
      </div>
    );
  }

  return (
    <div id="rfq-top" className="grid scroll-mt-28 gap-8 lg:grid-cols-12">
      <form onSubmit={submit} noValidate className="lg:col-span-8">
        <div className="sticky top-[72px] z-30 -mx-4 mb-6 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur lg:hidden" aria-live="polite">
          <p className="text-xs text-muted">التقدير المبدئي</p>
          <p className="font-display text-lg font-bold text-gold">{formatSAR(est.low)} – {formatSAR(est.high)}</p>
        </div>
        <ol className="mb-8 flex gap-2" aria-label="مراحل الطلب">
          {steps.map((s, i) => (
            <li key={s} className="flex-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className="w-full text-start disabled:cursor-default"
              >
                <span className={`block h-1.5 rounded-full transition ${i <= step ? "bg-gold" : "bg-line"}`} />
                <span className={`mt-3 hidden text-xs sm:block ${i === step ? "font-semibold text-fg" : "text-muted"}`}>{s}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="card p-6 md:p-10">
          <p className="text-sm text-muted">الخطوة {step + 1} من {steps.length}</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">{steps[step]}</h2>

          <div className="mt-8">
            {step === 0 && (
              <div className="space-y-10">
                <Fieldset legend="ما نوع فعاليتك؟">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {eventKinds.map((k) => (
                      <Choice key={k.id} name="kind" checked={form.kind === k.id} onChange={() => set("kind", k.id)}>
                        {k.label}
                      </Choice>
                    ))}
                  </div>
                </Fieldset>
                <Fieldset legend="مستوى التجربة">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {tiers.map((t) => (
                      <Choice key={t.id} name="tier" checked={form.tier === t.id} onChange={() => set("tier", t.id)}>
                        <span className="block font-semibold">{t.label}</span>
                        <span className="mt-1 block text-xs text-muted">{t.note}</span>
                      </Choice>
                    ))}
                  </div>
                </Fieldset>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <label htmlFor="guests" className="label">عدد الحضور المتوقع</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={10}
                      max={20000}
                      step={10}
                      value={Math.min(form.guests, 20000)}
                      onChange={(e) => set("guests", Number(e.target.value))}
                      className="flex-1 accent-[rgb(var(--gold))]"
                      aria-label="عدد الحضور"
                    />
                    <input
                      id="guests"
                      type="number"
                      inputMode="numeric"
                      min={10}
                      value={form.guests}
                      onChange={(e) => set("guests", Number(e.target.value))}
                      className="field w-32 text-center"
                      dir="ltr"
                      aria-invalid={!!errors.guests}
                    />
                  </div>
                  <FieldError msg={errors.guests} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="days" className="label">مدة الفعالية (أيام)</label>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-ghost h-12 w-12 p-0" onClick={() => set("days", Math.max(1, form.days - 1))} aria-label="إنقاص يوم">−</button>
                      <input id="days" type="number" min={1} max={30} value={form.days} onChange={(e) => set("days", Number(e.target.value))} className="field text-center" dir="ltr" aria-invalid={!!errors.days} />
                      <button type="button" className="btn-ghost h-12 w-12 p-0" onClick={() => set("days", Math.min(30, form.days + 1))} aria-label="زيادة يوم">+</button>
                    </div>
                    <FieldError msg={errors.days} />
                  </div>
                  <div>
                    <label htmlFor="city" className="label">المدينة / المنطقة</label>
                    <select id="city" value={form.city} onChange={(e) => set("city", e.target.value as CityId)} className="field">
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <Fieldset legend="اختر الخدمات التي تحتاجها (يمكن اختيار أكثر من خدمة)">
                <div className="grid gap-3 sm:grid-cols-2">
                  {addOns.map((a) => (
                    <Choice key={a.id} type="checkbox" name="addOns" checked={form.addOns.includes(a.id)} onChange={() => toggleAddOn(a.id)}>
                      {a.label}
                    </Choice>
                  ))}
                </div>
              </Fieldset>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="date" className="label">التاريخ المتوقع</label>
                    <input id="date" type="date" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set("date", e.target.value)} className="field" aria-invalid={!!errors.date} />
                    <FieldError msg={errors.date} />
                  </div>
                  <div>
                    <label htmlFor="budget" className="label">الميزانية التقريبية</label>
                    <select id="budget" value={form.budget} onChange={(e) => set("budget", e.target.value as Form["budget"])} className="field">
                      {Object.entries(budgetLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <Fieldset legend="مكان الفعالية">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.entries(venueLabels).map(([k, v]) => (
                      <Choice key={k} name="venue" checked={form.venueStatus === k} onChange={() => set("venueStatus", k as Form["venueStatus"])}>{v}</Choice>
                    ))}
                  </div>
                </Fieldset>
                <div>
                  <label htmlFor="goals" className="label">أهداف الفعالية وأي تفاصيل إضافية <span className="text-muted">(اختياري)</span></label>
                  <textarea id="goals" rows={4} maxLength={2000} value={form.goals} onChange={(e) => set("goals", e.target.value)} className="field" placeholder="مثال: إطلاق منتج جديد لكبار العملاء مع تغطية إعلامية..." />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField id="name" label="الاسم الكامل" value={form.name} onChange={(v) => set("name", v)} error={errors.name} autoComplete="name" />
                <TextField id="organization" label="الجهة / الشركة" value={form.organization} onChange={(v) => set("organization", v)} error={errors.organization} autoComplete="organization" />
                <TextField id="email" type="email" label="البريد الإلكتروني" value={form.email} onChange={(v) => set("email", v)} error={errors.email} autoComplete="email" ltr />
                <TextField id="phone" type="tel" label="رقم الجوال" value={form.phone} onChange={(v) => set("phone", v)} error={errors.phone} autoComplete="tel" placeholder="05XXXXXXXX" ltr />
                {/* حقل فخ للبوتات، مخفي عن المستخدمين */}
                <input type="text" name="company_site" tabIndex={-1} autoComplete="off" value={form.company_site} onChange={(e) => set("company_site", e.target.value)} className="hidden" aria-hidden />
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-7">
                    <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1.5 h-4 w-4 accent-[rgb(var(--gold))]" aria-invalid={!!errors.consent} />
                    <span>
                      أوافق على معالجة بياناتي وفق <Link href="/privacy" className="text-gold underline">سياسة الخصوصية</Link> ونظام حماية البيانات الشخصية، ولاستلام التواصل عبر البريد وواتساب.
                    </span>
                  </label>
                  <FieldError msg={errors.consent} />
                </div>
              </div>
            )}
          </div>

          {serverError && <p className="mt-6 rounded-2xl border border-clay/40 bg-clay/10 p-4 text-sm text-clay" role="alert">{serverError}</p>}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={`btn-ghost ${step === 0 ? "invisible" : ""}`}>
              السابق
            </button>
            <button type="submit" className="btn-primary px-8" disabled={submitting}>
              {step === steps.length - 1 ? (submitting ? "جارٍ الإرسال..." : "إرسال الطلب") : "التالي"}
              {!submitting && <ArrowIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>

      <aside className="lg:col-span-4">
        <div className="card sticky top-24 overflow-hidden">
          <div className="relative bg-elevated p-6">
            <div className="sadu absolute inset-0 opacity-50" aria-hidden />
            <p className="relative text-sm text-muted">التقدير المبدئي لفعاليتك</p>
            <p className="relative mt-2 font-display text-3xl font-bold text-gold">
              {formatSAR(est.low)}
            </p>
            <p className="relative text-sm text-muted">إلى {formatSAR(est.high)}</p>
          </div>
          <dl className="divide-y divide-line text-sm">
            <Row k="النوع" v={kindLabel} />
            <Row k="المستوى" v={tiers.find((t) => t.id === form.tier)!.label} />
            <Row k="الحضور" v={form.guests.toLocaleString("ar-SA-u-nu-latn")} />
            <Row k="المدة" v={`${form.days.toLocaleString("ar-SA-u-nu-latn")} ${form.days > 2 ? "أيام" : form.days === 2 ? "يومان" : "يوم"}`} />
            <Row k="المدينة" v={cityLabel} />
            <Row k="الخدمات" v={form.addOns.length ? `${form.addOns.length.toLocaleString("ar-SA-u-nu-latn")} خدمات` : "—"} />
            <Row k="تقريبًا لكل حاضر" v={formatSAR(est.perGuest)} />
          </dl>
          <p className="border-t border-line p-6 text-xs leading-6 text-muted">
            تقدير استرشادي غير ملزم مبني على متوسطات السوق، ويُعتمد العرض النهائي بعد جلسة الاكتشاف مع فريقنا.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="label mb-4">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Choice({ children, checked, onChange, name, type = "radio" }: { children: ReactNode; checked: boolean; onChange: () => void; name: string; type?: "radio" | "checkbox" }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
        checked ? "border-gold bg-gold/10" : "border-line hover:border-gold/50"
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`grid h-5 w-5 shrink-0 place-items-center border ${type === "radio" ? "rounded-full" : "rounded-md"} ${checked ? "border-gold bg-gold text-bg" : "border-line"}`}>
        {checked && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}
      </span>
      <span className="flex-1">{children}</span>
    </label>
  );
}

function TextField({ id, label, value, onChange, error, type = "text", autoComplete, placeholder, ltr }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string; placeholder?: string; ltr?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        dir={ltr ? "ltr" : undefined}
        className={`field ${ltr ? "text-right" : ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <FieldError id={`${id}-error`} msg={error} />
    </div>
  );
}

function FieldError({ msg, id }: { msg?: string; id?: string }) {
  return msg ? <p id={id} className="mt-2 text-sm text-clay">{msg}</p> : null;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 px-6 py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
