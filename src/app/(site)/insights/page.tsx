import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { insights } from "@/content/insights";

export const metadata: Metadata = {
  title: "رؤى وأفكار",
  description: "مقالات الخبراء حول اتجاهات صناعة الفعاليات والمؤتمرات في المملكة العربية السعودية.",
  alternates: { canonical: "/insights" },
};

const fmt = (d: string) => new Intl.DateTimeFormat("ar-SA-u-nu-latn", { dateStyle: "long", calendar: "gregory" }).format(new Date(d));

export default function InsightsPage() {
  const [lead, ...rest] = insights;
  return (
    <>
      <PageHero eyebrow="رؤى وأفكار" title="من قلب صناعة الفعاليات السعودية" lead="اتجاهات السوق، أفضل الممارسات التشغيلية، والتقنيات التي تعيد تشكيل تجربة الحضور." />
      <section className="container">
        <Link href={`/insights/${lead.slug}`} className="card group grid gap-8 p-8 transition hover:border-gold/60 md:grid-cols-2 md:p-12">
          <div>
            <span className="text-xs font-semibold text-gold">{lead.category} · مقال مميز</span>
            <h2 className="mt-4 text-3xl font-bold leading-snug group-hover:text-gold md:text-4xl">{lead.title}</h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-muted">{lead.excerpt}</p>
            <p className="mt-6 text-sm text-muted">{fmt(lead.date)} · {lead.readMinutes} دقائق قراءة</p>
          </div>
        </Link>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {rest.map((p) => (
            <Link key={p.slug} href={`/insights/${p.slug}`} className="card group block p-8 transition hover:border-gold/60">
              <span className="text-xs font-semibold text-gold">{p.category}</span>
              <h2 className="mt-4 text-2xl font-bold leading-snug group-hover:text-gold">{p.title}</h2>
              <p className="mt-3 leading-8 text-muted">{p.excerpt}</p>
              <p className="mt-6 text-sm text-muted">{fmt(p.date)} · {p.readMinutes} دقائق قراءة</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
