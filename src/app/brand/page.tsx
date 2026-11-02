import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { gradients, logoFiles, logoRules, palette, tokens, typography, type Swatch } from "@/content/brand";
import { galleryByIds } from "@/content/gallery";
import { phones, site } from "@/content/site";
import { contrastRatio, hexToRgb, wcagLevel } from "@/lib/color";

export const metadata: Metadata = {
  title: "دليل الهوية البصرية",
  description: "الشعار والألوان والخطوط وقواعد الاستخدام لهوية NMR Events، مع ملفات الشعار للتحميل.",
  alternates: { canonical: "/brand" },
};

const rgbText = (hex: string) => hexToRgb(hex).join(", ");

function SwatchCard({ s }: { s: Swatch }) {
  const ratio = contrastRatio(s.hex, s.on);
  return (
    <figure className="card break-inside-avoid overflow-hidden">
      <div className="flex h-36 flex-col justify-end p-5" style={{ background: s.hex, color: s.on }}>
        <span className="font-display text-xl font-bold">{s.nameAr}</span>
        <span className="text-sm opacity-90" dir="ltr">{s.name}</span>
      </div>
      <figcaption className="space-y-2 p-5 text-sm">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1" dir="ltr">
          <dt className="text-muted">HEX</dt><dd className="font-mono font-semibold">{s.hex}</dd>
          <dt className="text-muted">RGB</dt><dd className="font-mono">{rgbText(s.hex)}</dd>
        </dl>
        <p className="font-semibold">{s.role}</p>
        <p className="leading-7 text-muted">{s.usage}</p>
        <p className="text-xs text-muted">تباين النص فوقها: <span dir="ltr">{ratio.toFixed(1)}:1</span> ({wcagLevel(ratio)})</p>
      </figcaption>
    </figure>
  );
}

const contrastRows = [
  ["النص الأساسي", "fg", "bg"],
  ["النص الثانوي", "muted", "bg"],
  ["لون العلامة كنص", "brand", "bg"],
  ["نص الزر الرئيسي", "bg", "brand"],
  ["رسائل الخطأ", "danger", "bg"],
] as const;

export default function BrandPage() {
  const photos = galleryByIds(["jetour-booth", "tanweel-booth", "booth-concepts", "team-black-vests"]);
  const nav = [["logo", "الشعار"], ["colors", "الألوان"], ["type", "الخطوط"], ["imagery", "الصور"], ["apps", "التطبيقات"], ["downloads", "التحميلات"]] as const;

  return (
    <>
      <PageHero
        eyebrow="دليل الهوية البصرية"
        title={<>هوية <span className="text-brand">NMR Events</span></>}
        lead="Creating Extraordinary Experiences — نصنع تجارب استثنائية. مرجع موحّد للشعار والألوان والخطوط وقواعد الاستخدام، مستخلص من الشعار الرسمي وملف تعريف الشركة 2026."
      >
        <nav aria-label="أقسام الدليل" className="mt-8 flex flex-wrap gap-2 print:hidden">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand">{label}</a>
          ))}
        </nav>
      </PageHero>

      {/* ===== جوهر العلامة ===== */}
      <section className="container grid gap-4 md:grid-cols-3">
        {[
          ["الشخصية", "جريئة وطموحة، احترافية في التنفيذ، سعودية الأصالة بلغة عالمية."],
          ["الشعار اللفظي", "Creating Extraordinary Experiences — نصنع تجارب استثنائية."],
          ["العبارة الداعمة", "Driven by Ambition. Defined by Excellence — برؤية طموحة وتميّز مستمر."],
        ].map(([h, p]) => (
          <div key={h} className="card break-inside-avoid p-7">
            <span className="eyebrow">{h}</span>
            <p className="mt-4 text-lg leading-8">{p}</p>
          </div>
        ))}
      </section>

      {/* ===== الشعار ===== */}
      <section id="logo" className="container mt-24 scroll-mt-28">
        <SectionHeading eyebrow="01 — الشعار" title={<>الأسد وحروف <span className="text-brand">NMR</span></>} lead="أسد برتقالي يخرج من حرف N، وحروف NMR هندسية قوية، وسطر EVENTS هادئ تحتها. الأسد رمز القوة والإقدام." />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid place-items-center rounded-3xl p-10 ring-1 ring-white/10 md:col-span-2" style={{ background: "#070B3F" }}>
            <Image src="/images/brand/nmr-logo.png" alt="الشعار الرسمي لـ NMR Events على خلفية كحلية" width={722} height={331} className="h-auto w-full max-w-md" priority />
          </div>
          <div className="card break-inside-avoid p-7">
            <h3 className="text-xl font-bold">مساحة الأمان والحجم</h3>
            <div className="mt-5 grid place-items-center rounded-2xl bg-elevated p-5" aria-hidden>
              <div className="relative p-6" style={{ outline: "1.5px dashed rgb(var(--brand))", outlineOffset: 0 }}>
                <Image src="/images/brand/nmr-logo-on-light.png" alt="" width={722} height={331} className="h-auto w-40 dark:hidden" />
                <Image src="/images/brand/nmr-logo.png" alt="" width={722} height={331} className="hidden h-auto w-40 dark:block" />
                <span className="absolute start-1 top-1 text-[10px] font-bold text-brand">x</span>
                <span className="absolute bottom-1 end-1 text-[10px] font-bold text-brand">x</span>
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-sm leading-7 text-muted">
              <li>مساحة الأمان: {logoRules.clearSpace}.</li>
              <li>الحد الأدنى للعرض: <span dir="ltr">{logoRules.minWidthPx}px</span> للشاشات و<span dir="ltr">{logoRules.minWidthMm}mm</span> للطباعة.</li>
            </ul>
          </div>
        </div>

        <h3 className="mb-4 mt-10 text-xl font-bold">نسخ الشعار المعتمدة</h3>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {logoFiles.map((l) => (
            <li key={l.file} className="break-inside-avoid">
              <figure className="overflow-hidden rounded-2xl border border-line">
                <div className="grid h-28 place-items-center p-3" style={{ background: l.bg }}>
                  <Image src={`/images/brand/${l.file}`} alt={l.label} width={722} height={331} className="max-h-full w-auto" />
                </div>
                <figcaption className="p-3 text-xs leading-6 text-muted">{l.label}</figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card break-inside-avoid p-7">
            <h3 className="text-xl font-bold text-brand">افعل</h3>
            <ul className="mt-4 space-y-3 leading-7">{logoRules.dos.map((d) => <li key={d} className="flex gap-3"><span className="text-brand" aria-hidden>✓</span>{d}</li>)}</ul>
          </div>
          <div className="card break-inside-avoid p-7">
            <h3 className="text-xl font-bold text-danger">لا تفعل</h3>
            <ul className="mt-4 space-y-3 leading-7">{logoRules.donts.map((d) => <li key={d} className="flex gap-3"><span className="text-danger" aria-hidden>✕</span>{d}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* ===== الألوان ===== */}
      <section id="colors" className="container mt-24 scroll-mt-28">
        <SectionHeading eyebrow="02 — الألوان" title={<>لوحة من <span className="text-brand">المسرح</span></>} lead="برتقالي الشعار فوق كحلي عميق وتوهجات بنفسجية ورملية، كما في ملف التعريف. البرتقالي نجم التصميم، لا يتجاوز 10–15% من المساحة." />
        {(["primary", "supporting", "neutrals"] as const).map((g, i) => (
          <div key={g} className="mb-8">
            <h3 className="mb-4 text-lg font-bold">{["الألوان الأساسية", "الألوان الداعمة", "الألوان المحايدة"][i]}</h3>
            <div className="grid gap-4 md:grid-cols-3">{palette[g].map((s) => <SwatchCard key={s.hex} s={s} />)}</div>
          </div>
        ))}

        <h3 className="mb-4 mt-12 text-lg font-bold">التدرجات</h3>
        <ul className="grid gap-4 md:grid-cols-3">
          {gradients.map((g) => (
            <li key={g.name} className="card break-inside-avoid overflow-hidden">
              <div className="h-32" style={{ background: g.css }} />
              <div className="p-5 text-sm"><p className="font-semibold">{g.nameAr} <span className="text-muted" dir="ltr">— {g.name}</span></p><p className="mt-1 leading-7 text-muted">{g.use}</p></div>
            </li>
          ))}
        </ul>

        <h3 className="mb-2 mt-12 text-lg font-bold">إمكانية الوصول (WCAG)</h3>
        <p className="mb-4 text-muted">نسب التباين المعتمدة في الموقع، ويتحقق منها اختبار آلي في كل تعديل. الحد الأدنى للنص العادي 4.5:1.</p>
        <div className="card overflow-x-auto break-inside-avoid">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-line text-start text-muted"><th className="p-4 text-start font-medium">الاستخدام</th><th className="p-4 text-start font-medium">الوضع الداكن</th><th className="p-4 text-start font-medium">الوضع الفاتح</th></tr></thead>
            <tbody>
              {contrastRows.map(([label, fg, bg]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="p-4">{label}</td>
                  {(["dark", "light"] as const).map((th) => {
                    const r = contrastRatio(tokens[th][fg], tokens[th][bg]);
                    return (
                      <td key={th} className="p-4">
                        <span className="inline-flex items-center gap-3">
                          <span className="grid h-8 w-12 place-items-center rounded-md text-xs font-bold" style={{ background: tokens[th][bg], color: tokens[th][fg] }} aria-hidden>Aa</span>
                          <span dir="ltr">{r.toFixed(1)}:1</span> <span className="text-muted">{wcagLevel(r)}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== الخطوط ===== */}
      <section id="type" className="container mt-24 scroll-mt-28">
        <SectionHeading eyebrow="03 — الخطوط" title={<>خطان، <span className="text-brand">نبرة واحدة</span></>} lead="عناوين هندسية عريضة تناسب حروف الشعار، ونص هادئ مريح للقراءة الطويلة." />
        <div className="grid gap-4 md:grid-cols-2">
          {([["display", "العناوين"], ["body", "النصوص"]] as const).map(([k, label]) => (
            <div key={k} className="card break-inside-avoid p-7">
              <span className="eyebrow">{label}</span>
              <p className={`mt-4 text-5xl ${k === "display" ? "font-display font-extrabold" : "font-sans font-medium"}`} dir="ltr">Aa أب</p>
              <p className="mt-4 text-xl font-bold" dir="ltr">{typography[k].family}</p>
              <p className="text-sm text-muted" dir="ltr">{typography[k].weights}</p>
              <p className="mt-3 leading-7 text-muted">{typography[k].use}</p>
            </div>
          ))}
        </div>
        <div className="card mt-4 divide-y divide-line break-inside-avoid">
          {typography.scale.map((t) => (
            <div key={t.name} className="grid gap-2 p-6 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="text-sm text-muted">{t.name}</span>
              <p className={`${t.cls} ${t.cls.includes("text-5xl") || t.cls.includes("text-3xl") || t.cls.includes("text-xl") ? "font-display" : ""}`}>{t.sample}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== الصور ===== */}
      <section id="imagery" className="container mt-24 scroll-mt-28">
        <SectionHeading eyebrow="04 — الصور" title={<>صور حقيقية <span className="text-brand">من الميدان</span></>} lead="نفضّل صور التنفيذ الحقيقية بإضاءة دافئة وزوايا واسعة، وتظهر الإضاءة بألوان العلامة (برتقالي وبنفسجي) فوق الخلفيات الداكنة. نتجنب الصور الجاهزة العامة." />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line break-inside-avoid">
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
            </li>
          ))}
        </ul>
      </section>

      {/* ===== التطبيقات ===== */}
      <section id="apps" className="container mt-24 scroll-mt-28">
        <SectionHeading eyebrow="05 — التطبيقات" title={<>الهوية <span className="text-brand">في الاستخدام</span></>} lead="نماذج توضح تطبيق الشعار والألوان على بطاقة الأعمال وأيقونة التطبيق وغلاف المنشورات." />
        <div className="grid items-start gap-6 md:grid-cols-3">
          {/* بطاقة الأعمال */}
          <div className="break-inside-avoid space-y-3">
            <div className="grid aspect-[1.75] place-items-center rounded-2xl p-6 shadow-lg ring-1 ring-white/20" style={{ background: "#070B3F" }} aria-label="الوجه الأمامي لبطاقة الأعمال">
              <Image src="/images/brand/nmr-logo.png" alt="" width={722} height={331} className="h-auto w-44" />
            </div>
            <div className="flex aspect-[1.75] flex-col justify-between rounded-2xl bg-white p-6 text-[#070B3F] shadow-lg" aria-label="الخلف لبطاقة الأعمال">
              <Image src="/images/brand/nmr-logo-on-light.png" alt="" width={722} height={331} className="h-auto w-20" />
              <div className="text-xs leading-6" dir="ltr">
                <p className="font-bold">NMR Events</p>
                <p>{phones[0].display}</p>
                <p>{site.email}</p>
              </div>
              <div className="h-1 w-full rounded-full" style={{ background: "linear-gradient(135deg, #F05A22, #F6BC80)" }} />
            </div>
            <p className="text-sm text-muted">بطاقة الأعمال — <span dir="ltr">90×50 mm</span></p>
          </div>
          {/* أيقونة التطبيق */}
          <div className="break-inside-avoid">
            <div className="flex flex-wrap items-end gap-5">
              {[112, 72, 48].map((px) => (
                <Image key={px} src="/icons/icon-512.png" alt="أيقونة تطبيق NMR Events" width={px} height={px} className="rounded-[22%] shadow-lg ring-1 ring-white/25" />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">أيقونة التطبيق: الرمز فقط فوق الكحلي (بدون سطر EVENTS لوضوحه في الأحجام الصغيرة).</p>
          </div>
          {/* غلاف المنشور */}
          <div className="break-inside-avoid">
            <div className="relative aspect-square overflow-hidden rounded-2xl p-7 shadow-lg ring-1 ring-white/20" style={{ background: gradients[0].css }}>
              <Image src="/images/brand/nmr-logo.png" alt="" width={722} height={331} className="h-auto w-28" />
              <p className="absolute inset-x-7 bottom-7 text-balance font-display text-3xl font-extrabold leading-tight text-white" dir="ltr">
                Creating <span style={{ color: "#F6BC80" }}>Extraordinary</span> Experiences.
              </p>
            </div>
            <p className="mt-3 text-sm text-muted">غلاف منشور — توهج المسرح + الكلمة المميزة بالرملي.</p>
          </div>
        </div>
      </section>

      {/* ===== التحميلات ===== */}
      <section id="downloads" className="container mt-24 scroll-mt-28 print:hidden">
        <SectionHeading eyebrow="06 — التحميلات" title={<>حزمة <span className="text-brand">الهوية</span></>} lead="الشعار بصيغة PNG شفاف (722×331). للطباعة الكبيرة اطلب النسخة المتجهة (Vector) من فريق التصميم." />
        <ul className="grid gap-3 md:grid-cols-2">
          {logoFiles.map((l) => (
            <li key={l.file}>
              <a href={`/images/brand/${l.file}`} download className="card flex items-center justify-between gap-4 p-5 transition hover:border-brand">
                <span>{l.label}</span><span className="shrink-0 text-sm font-semibold text-brand" dir="ltr">{l.file}</span>
              </a>
            </li>
          ))}
          <li>
            <a href="/files/nmr-brand-guidelines.pdf" download className="card flex items-center justify-between gap-4 border-brand/50 p-5 transition hover:border-brand">
              <span className="font-semibold">دليل الهوية البصرية (PDF)</span><span className="shrink-0 text-sm font-semibold text-brand" dir="ltr">nmr-brand-guidelines.pdf</span>
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
