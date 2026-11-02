"use client";

import { useMemo, useState } from "react";
import { eventTypes, type Project } from "@/content/projects";
import { sectors } from "@/content/site";
import { ProjectCard } from "./ProjectCard";

const ALL = "الكل";

function Chips({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {[ALL, ...options].map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            value === o ? "border-gold bg-gold text-bg" : "border-line text-muted hover:border-gold hover:text-fg"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function PortfolioExplorer({ projects }: { projects: Project[] }) {
  const [sector, setSector] = useState(ALL);
  const [type, setType] = useState(ALL);

  const filtered = useMemo(
    () => projects.filter((p) => (sector === ALL || p.sector === sector) && (type === ALL || p.type === type)),
    [projects, sector, type],
  );

  return (
    <>
      <div className="card mb-10 space-y-5 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <span className="w-24 shrink-0 text-sm font-semibold">القطاع</span>
          <Chips label="فلترة حسب القطاع" options={sectors} value={sector} onChange={setSector} />
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-5 md:flex-row md:items-center">
          <span className="w-24 shrink-0 text-sm font-semibold">نوع الفعالية</span>
          <Chips label="فلترة حسب النوع" options={eventTypes} value={type} onChange={setType} />
        </div>
      </div>
      <p className="mb-6 text-sm text-muted" aria-live="polite">{filtered.length} من {projects.length} مشروعًا</p>
      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-lg">لا توجد مشاريع مطابقة لهذا الاختيار حاليًا.</p>
          <button type="button" className="btn-ghost mt-6" onClick={() => { setSector(ALL); setType(ALL); }}>إعادة ضبط الفلاتر</button>
        </div>
      )}
    </>
  );
}
