import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { ArrowIcon, CheckIcon, serviceIcons } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "الخدمات المتكاملة",
  description: "الإبداع والإنتاج، الحلول الرقمية والهولوجرام، اللوجستيات والتنقل الذكي، الكوادر والمضيفون، وإدارة الحشود والسلامة.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="الخدمات المتكاملة"
        title={<>كل ما تحتاجه فعاليتك، <span className="text-gold">تحت سقف واحد</span></>}
        lead="خمس ركائز تعمل بتناغم عبر غرفة عمليات واحدة ومدير مشروع واحد، لتتفرغ أنت لضيوفك."
      >
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="الانتقال إلى خدمة">
          {services.map((s) => (
            <a key={s.slug} href={`#${s.slug}`} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:border-gold hover:text-gold">{s.title}</a>
          ))}
        </nav>
      </PageHero>

      <div className="container space-y-6">
        {services.map((s, i) => {
          const Icon = serviceIcons[s.icon];
          return (
            <Reveal key={s.slug}>
              <article id={s.slug} className="card grid scroll-mt-28 gap-10 p-8 md:p-12 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="flex items-center gap-4">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold"><Icon className="h-7 w-7" /></span>
                    <span className="font-display text-sm text-muted">{`0${i + 1} / 0${services.length}`}</span>
                  </div>
                  <h2 className="mt-6 text-3xl font-bold md:text-4xl">{s.title}</h2>
                  <p className="mt-4 text-lg leading-9 text-muted">{s.description}</p>
                  <Link href={`/services/${s.slug}`} className="btn-ghost mt-8">تفاصيل الخدمة <ArrowIcon className="h-4 w-4" /></Link>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-gold">القدرات</h3>
                    <ul className="space-y-3">
                      {s.capabilities.map((c) => (
                        <li key={c} className="flex items-start gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-gold" />{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-gold">المخرجات</h3>
                    <ul className="space-y-3">
                      {s.deliverables.map((d) => (
                        <li key={d} className="rounded-2xl bg-elevated px-4 py-3 text-sm">{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
      <div className="mt-24"><CtaBand /></div>
    </>
  );
}
