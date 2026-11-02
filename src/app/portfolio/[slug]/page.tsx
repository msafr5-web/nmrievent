import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { ArrowIcon } from "@/components/icons";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCover } from "@/components/ProjectCover";
import { getProject, projects } from "@/content/projects";
import { getService } from "@/content/services";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => projects.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.title, description: p.summary, alternates: { canonical: `/portfolio/${p.slug}` } } : {};
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const related = projects.filter((p) => p.slug !== project.slug && p.sector === project.sector).concat(projects.filter((p) => p.slug !== project.slug)).filter((p, i, a) => a.indexOf(p) === i).slice(0, 3);

  const facts = [
    { k: "العميل", v: project.client },
    { k: "القطاع", v: project.sector },
    { k: "نوع الفعالية", v: project.type },
    { k: "المدينة", v: project.city },
    { k: "السنة", v: String(project.year) },
    { k: "الحضور", v: project.attendees },
  ];

  return (
    <>
      <section className="pt-28 md:pt-32">
        <div className="container">
          <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
            <ArrowIcon className="h-4 w-4 rotate-180" /> العودة إلى معرض الأعمال
          </Link>
          <h1 className="mt-6 max-w-4xl text-balance text-4xl font-bold leading-tight md:text-6xl">{project.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{project.summary}</p>
          <div className="mt-10 overflow-hidden rounded-[2rem] border border-line">
            <ProjectCover palette={project.palette} seed={project.slug} className="aspect-[21/9] w-full" />
          </div>
        </div>
      </section>

      <section className="container mt-12 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <dl className="card divide-y divide-line">
            {facts.map((f) => (
              <div key={f.k} className="flex justify-between gap-4 px-6 py-4 text-sm">
                <dt className="text-muted">{f.k}</dt>
                <dd className="font-semibold">{f.v}</dd>
              </div>
            ))}
          </dl>
        </aside>
        <div className="space-y-10 lg:col-span-8">
          <div>
            <h2 className="text-2xl font-bold">التحدي</h2>
            <p className="mt-4 text-lg leading-9 text-muted">{project.challenge}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">الحل</h2>
            <p className="mt-4 text-lg leading-9 text-muted">{project.solution}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">النتائج</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {project.results.map((r) => (
                <div key={r.label} className="card p-6">
                  <dd className="font-display text-3xl font-bold text-gold">{r.value}</dd>
                  <dt className="mt-2 text-sm text-muted">{r.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-2xl font-bold">الخدمات المقدمة</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.services.map((slug) => {
                const s = getService(slug);
                return s ? (
                  <Link key={slug} href={`/services/${slug}`} className="rounded-full border border-line px-4 py-2 text-sm hover:border-gold hover:text-gold">{s.title}</Link>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-24">
        <h2 className="mb-8 text-2xl font-bold">مشاريع ذات صلة</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {related.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
      </section>
      <div className="mt-24"><CtaBand /></div>
    </>
  );
}
