import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { journey, stats } from "@/content/site";

export const metadata: Metadata = {
  title: "من نحن",
  description: "nmrievent شريك سعودي متكامل يجمع الإبداع والتقنية والتشغيل والكوادر لصناعة فعاليات بمستوى عالمي.",
  alternates: { canonical: "/about" },
};

const values = [
  { title: "أصالة بلغة عالمية", text: "نستلهم من الإرث السعودي ونقدمه بمعايير تنافس أكبر الفعاليات العالمية." },
  { title: "مسؤولية واحدة", text: "مدير مشروع واحد وغرفة عمليات واحدة، فلا تضيع المسؤولية بين الموردين." },
  { title: "قرارات بالأرقام", text: "نقيس كل ما يمكن قياسه: زمن الدخول، التفاعل، الرضا، والعائد على الفعالية." },
  { title: "كوادر وطنية", text: "نستثمر في تأهيل الشباب السعودي ليكونوا واجهة الضيافة في فعالياتنا." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="من نحن"
        title={<>نجمع <span className="text-gold">الإبداع</span> و<span className="text-gold">التقنية</span> و<span className="text-gold">التشغيل</span> في فريق واحد</>}
        lead="وُلدت nmrievent من قناعة بسيطة: الفعالية الاستثنائية تحتاج شريكًا يفهم الفكرة الإبداعية، ويملك التقنية، ويقدر على تشغيل مئات الآلاف من الزوار بأمان."
      />
      <section className="container grid gap-6 md:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="card p-8">
            <h2 className="text-2xl font-bold">{v.title}</h2>
            <p className="mt-3 leading-8 text-muted">{v.text}</p>
          </div>
        ))}
      </section>
      <section className="container mt-20">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-6 text-center">
              <dd className="font-display text-4xl font-bold text-gold" dir="ltr">{s.value.toLocaleString("en-US")}{s.suffix}</dd>
              <dt className="mt-2 text-sm text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>
      <section className="container mt-20">
        <h2 className="text-3xl font-bold">رحلة الأثر</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {journey.map((j, i) => (
            <div key={j.key} className="rounded-3xl border border-line p-6">
              <span className="font-display text-gold">{`0${i + 1}`}</span>
              <h3 className="mt-3 text-xl font-bold">{j.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{j.text}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-24"><CtaBand /></div>
    </>
  );
}
