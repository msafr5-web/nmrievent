import Link from "next/link";
import type { Project } from "@/content/projects";
import { ProjectCover } from "./ProjectCover";

export function ProjectCard({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-line bg-surface"
    >
      <div className={`relative overflow-hidden ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <ProjectCover
          palette={project.palette}
          seed={project.slug}
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
          <span className="rounded-full bg-black/45 px-3 py-1 text-xs text-white backdrop-blur">{project.type}</span>
          <span className="rounded-full bg-black/45 px-3 py-1 text-xs text-white backdrop-blur">{project.city}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{project.sector}</span>
          <span dir="ltr">{project.year}</span>
        </div>
        <h3 className="mt-3 text-xl font-bold transition group-hover:text-gold">{project.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{project.summary}</p>
        <p className="mt-4 text-sm"><span className="text-gold">{project.attendees}</span> <span className="text-muted">حاضر</span></p>
      </div>
    </Link>
  );
}
