"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { journey, site } from "@/content/site";
import { formatSAR } from "@/lib/estimator";
import { whatsappLink } from "@/lib/rfq-shared";
import type { Approval, LeadStage, Project } from "@/server/types";
import { leadStages } from "@/server/types";
import { CheckIcon, WhatsAppIcon } from "../icons";
import { api } from "./api";
import { Modal } from "./Modal";
import { SignaturePad } from "./SignaturePad";
import { Badge, Empty, Meter, Panel, fmtDate, fmtDateTime } from "./ui";

type PortalProject = Omit<Project, "assignments">;
type PortalLead = { reference: string; stage: LeadStage; receivedAt: string; organization: string; low: number; high: number };

export function ClientPortal({ projects, leads, team }: { projects: PortalProject[]; leads: PortalLead[]; team: Record<string, { assigned: number; present: number }> }) {
  const [id, setId] = useState(projects[0]?.id ?? "");
  const project = projects.find((p) => p.id === id);

  if (!project) {
    const lead = leads[0];
    return lead ? (
      <Panel title={`طلبك رقم ${lead.reference}`}>
        <p className="leading-8 text-muted">
          استلمنا طلبك في {fmtDateTime(lead.receivedAt)}، وهو الآن في مرحلة <Badge tone="gold">{leadStages.find((s) => s.id === lead.stage)?.label}</Badge>.
          سيظهر هنا متتبع مراحل مشروعك والاعتمادات فور التعاقد.
        </p>
        <p className="mt-4 text-sm">التقدير المبدئي: <strong className="text-gold">{formatSAR(lead.low)} – {formatSAR(lead.high)}</strong></p>
      </Panel>
    ) : (
      <Empty>لا توجد مشاريع مرتبطة بحسابك بعد.</Empty>
    );
  }

  const t = team[project.id] ?? { assigned: 0, present: 0 };
  const crowd = project.zones.reduce((s, z) => s + z.current, 0);
  const cap = project.zones.reduce((s, z) => s + z.capacity, 0);

  return (
    <div className="space-y-6">
      {projects.length > 1 && (
        <div>
          <label htmlFor="cp" className="label">المشروع</label>
          <select id="cp" className="field max-w-md" value={id} onChange={(e) => setId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <Panel
        title={project.name}
        action={
          <a href={whatsappLink(site.whatsapp, `مرحبًا nmrievent، بخصوص مشروع ${project.name} (${project.reference})`)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] px-4 py-2 text-white">
            <WhatsAppIcon className="h-4 w-4" /> مدير المشروع
          </a>
        }
      >
        <div className="mb-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <span>الموعد: <strong className="text-fg">{fmtDate(project.date)}</strong></span>
          <span>المدة: <strong className="text-fg">{project.duration}</strong></span>
          <span>الموقع: <strong className="text-fg">{project.location}</strong></span>
          <span>المشرف: <strong className="text-fg">{project.supervisor}</strong></span>
        </div>
        <MilestoneTracker project={project} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Approvals project={project} /></div>
        <Panel title="التشغيل المباشر">
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="text-muted">الكوادر الميدانية في الموقع</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-palm">{t.present}<span className="text-base text-muted"> / {t.assigned}</span></dd>
            </div>
            <div>
              <dt className="mb-2 text-muted">الحضور الحالي</dt>
              <dd><p className="mb-2 font-semibold">{crowd.toLocaleString("en-US")} من {cap.toLocaleString("en-US")}</p><Meter value={crowd} max={cap} /></dd>
            </div>
            <div>
              <dt className="mb-2 text-muted">إشغال المواقف</dt>
              <dd><Meter value={project.parking.occupied} max={project.parking.capacity} /></dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="التقارير والتوثيق الإعلامي">
        {project.reports.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {project.reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-elevated p-4">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-muted">{r.kind} · {fmtDate(r.date)}</p>
                </div>
                <Badge tone="gold">متاح</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>ستظهر التقارير والتوثيق الإعلامي هنا مع تقدم المشروع.</Empty>
        )}
      </Panel>
    </div>
  );
}

/** FR-02: متتبع مراحل رحلة الأثر */
function MilestoneTracker({ project }: { project: PortalProject }) {
  const done = project.milestones.filter((m) => m.status === "done").length;
  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm">
        <span className="text-muted">تقدم المشروع</span>
        <span className="font-semibold text-gold">{Math.round((done / project.milestones.length) * 100)}%</span>
      </div>
      <ol className="grid gap-4 md:grid-cols-4">
        {project.milestones.map((m, i) => {
          const j = journey.find((x) => x.key === m.key)!;
          const tone = m.status === "done" ? "border-palm bg-palm text-bg" : m.status === "current" ? "border-gold bg-gold/15 text-gold" : "border-line text-muted";
          return (
            <li key={m.key} aria-current={m.status === "current" ? "step" : undefined} className={`relative rounded-2xl border p-4 ${m.status === "current" ? "border-gold" : "border-line"}`}>
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-display text-sm font-bold ${tone}`}>
                  {m.status === "done" ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </span>
                <div>
                  <p className="font-bold">{j.title}</p>
                  <p className="text-xs text-muted">{m.status === "done" ? "مكتملة" : m.status === "current" ? "جارية الآن" : "قادمة"}{m.date && ` · ${fmtDate(m.date)}`}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted">{m.note ?? j.text}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Approvals({ project }: { project: PortalProject }) {
  const router = useRouter();
  const [signing, setSigning] = useState<Approval | null>(null);
  const [signedBy, setSignedBy] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signing) return;
    setBusy(true);
    const r = await api("/api/portal/approve", "POST", { projectId: project.id, approvalId: signing.id, signedBy, signature: signature ?? "" });
    setBusy(false);
    if (!r.ok) return setError(Object.values(r.fields)[0] ?? r.error);
    setSigning(null);
    setSignature(null);
    router.refresh();
  };

  return (
    <Panel title="الاعتمادات والتوقيع الرقمي">
      <ul className="space-y-3">
        {project.approvals.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs text-muted">
                {a.kind}
                {a.status === "approved" && a.signedAt && ` · اعتمده ${a.signedBy} في ${fmtDateTime(a.signedAt)}`}
              </p>
            </div>
            {a.status === "approved" ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {a.signature && <img src={a.signature} alt={`توقيع ${a.signedBy}`} className="h-10 rounded bg-white px-1" />}
                <Badge tone="palm">معتمد</Badge>
              </div>
            ) : (
              <button className="btn-primary px-5 py-2" onClick={() => { setSigning(a); setError(""); }}>مراجعة وتوقيع</button>
            )}
          </li>
        ))}
      </ul>
      <Modal open={!!signing} onClose={() => setSigning(null)} title={signing?.title ?? ""}>
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm leading-7 text-muted">بالتوقيع أدناه تعتمد «{signing?.title}» لمشروع {project.name}. يُحفظ التوقيع مع اسم المعتمد ووقت الاعتماد.</p>
          <div>
            <label htmlFor="sb" className="label">اسم المعتمد</label>
            <input id="sb" className="field" value={signedBy} onChange={(e) => setSignedBy(e.target.value)} required />
          </div>
          <SignaturePad onChange={setSignature} />
          {error && <p className="text-sm text-clay" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy || !signature}>{busy ? "جارٍ الاعتماد..." : "اعتماد وتوقيع"}</button>
        </form>
      </Modal>
    </Panel>
  );
}
