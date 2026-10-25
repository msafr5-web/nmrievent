import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { CheckIcon, serviceIcons } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/content/projects";
import { getService, services } from "@/content/services";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => services.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getService((await params).slug);
  return s ? { title: s.title, description: s.short, alternates: { canonical: `/services/${s.slug}` } } : {};
}

export default async function ServicePage({ params }: Props) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const Icon = serviceIcons[service.icon];
  const work = projects.filter((p) => p.services.includes(service.slug)).slice(0, 3);

  return (
    <>
      <PageHero eyebrow="خدماتنا" title={service.title} lead={service.description}>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={`/rfq?service=${service.slug}`} className="btn-primary">اطلب هذه الخدمة</Link>
          <Link href="/services" className="btn-ghost">كل الخدمات</Link>
        </div>
      </PageHero>
      <section className="container grid gap-6 md:grid-cols-2">
        <div className="card p-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold"><Icon className="h-7 w-7" /></span>
          <h2 className="mt-6 text-2xl font-bold">ما الذي نقدمه</h2>
          <ul className="mt-6 space-y-4">
            {service.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-3 text-lg"><CheckIcon className="mt-1.5 h-5 w-5 shrink-0 text-gold" />{c}</li>
            ))}
          </ul>
        </div>
        <div className="card p-8">
          <h2 className="text-2xl font-bold">ما الذي تستلمه</h2>
          <ul className="mt-6 space-y-3">
            {service.deliverables.map((d, i) => (
              <li key={d} className="flex items-center gap-4 rounded-2xl bg-elevated p-4">
                <span className="font-display text-xl text-gold">{`0${i + 1}`}</span>{d}
              </li>
            ))}
          </ul>
        </div>
      </section>
      {work.length > 0 && (
        <section className="container mt-24">
          <h2 className="mb-8 text-2xl font-bold">أعمال قدمنا فيها هذه الخدمة</h2>
          <div className="grid gap-6 md:grid-cols-3">{work.map((p) => <ProjectCard key={p.slug} project={p} />)}</div>
        </section>
      )}
      <div className="mt-24"><CtaBand /></div>
    </>
  );
}
