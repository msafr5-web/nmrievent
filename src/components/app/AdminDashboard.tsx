"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { cities, eventKinds, formatCompactSAR, formatSAR } from "@/lib/estimator";
import { budgetLabels, whatsappLink } from "@/lib/rfq-shared";
import { journey } from "@/content/site";
import type { Lead, LeadStage, Project, Staff } from "@/server/types";
import { leadStages, projectStatuses } from "@/server/types";
import { api } from "./api";
import { Modal } from "./Modal";
import { QrImage } from "./QrImage";
import { Badge, Empty, Panel, Stat, fmtDate, fmtDateTime, statusTone } from "./ui";

type Data = { staff: Staff[]; projects: Project[]; leads: Lead[] };
const tabs = [
  { id: "overview", label: "نظرة عامة" },
  { id: "projects", label: "إدارة المشاريع" },
  { id: "staff", label: "قاعدة الموظفين" },
  { id: "crm", label: "خط المبيعات CRM" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export function AdminDashboard({ db, staffQr, assignQr }: { db: Data; staffQr: Record<string, string>; assignQr: Record<string, string> }) {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <>
      <div role="tablist" aria-label="أقسام لوحة الإدارة" className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm transition ${tab === t.id ? "bg-gold font-semibold text-bg" : "border border-line text-muted hover:text-fg"}`}
          >
            {t.label}
            {t.id === "staff" && ` (${db.staff.length})`}
            {t.id === "crm" && ` (${db.leads.filter((l) => l.stage === "new").length} جديد)`}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview db={db} onNavigate={setTab} />}
      {tab === "projects" && <Projects db={db} assignQr={assignQr} />}
      {tab === "staff" && <StaffPool staff={db.staff} projects={db.projects} staffQr={staffQr} />}
      {tab === "crm" && <Crm leads={db.leads} projects={db.projects} />}
    </>
  );
}

/* ---------------------------- نظرة عامة ---------------------------- */
function Overview({ db, onNavigate }: { db: Data; onNavigate: (t: Tab) => void }) {
  const k = useMemo(() => {
    const total = db.leads.length;
    const won = db.leads.filter((l) => l.stage === "won").length;
    const responded = db.leads.filter((l) => l.firstResponseAt);
    const avgH = responded.length
      ? responded.reduce((s, l) => s + (+new Date(l.firstResponseAt!) - +new Date(l.receivedAt)) / 3_600_000, 0) / responded.length
      : null;
    const pipeline = db.leads.filter((l) => !["lost", "won"].includes(l.stage)).reduce((s, l) => s + l.estimate.mid, 0);
    const assignments = db.projects.flatMap((p) => p.assignments);
    return {
      total,
      conv: total ? Math.round((won / total) * 100) : 0,
      avgH,
      pipeline,
      active: db.projects.filter((p) => p.status === "قيد التشغيل").length,
      study: db.projects.filter((p) => p.status === "دراسة وتحديد المتطلبات").length,
      assigned: assignments.length,
      checkedIn: assignments.filter((a) => a.checkIn).length,
      pendingApprovals: db.projects.flatMap((p) => p.approvals).filter((a) => a.status === "pending").length,
    };
  }, [db]);
  const maxStage = Math.max(1, ...leadStages.map((s) => db.leads.filter((l) => l.stage === s.id).length));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="طلبات عروض الأسعار" value={k.total} hint="إجمالي الطلبات من المهيّئ الذكي" />
        <Stat label="معدل التحويل إلى تعاقد" value={`${k.conv}%`} hint="المستهدف في PRD أعلى من 12%" tone={k.conv >= 12 ? "palm" : "clay"} />
        <Stat label="متوسط زمن الاستجابة" value={k.avgH === null ? "—" : `${k.avgH.toFixed(1)} س`} hint="المستهدف أقل من ساعتين" tone={k.avgH !== null && k.avgH <= 2 ? "palm" : "gold"} />
        <Stat label="قيمة خط المبيعات المفتوح" value={formatCompactSAR(k.pipeline)} hint="مجموع التقديرات للطلبات الجارية" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="مشاريع قيد التشغيل" value={k.active} tone="palm" />
        <Stat label="مشاريع قيد الدراسة" value={k.study} />
        <Stat label="الكوادر المسجلة" value={db.staff.length} hint={`${k.assigned} إسنادًا، ${k.checkedIn} حضروا`} />
        <Stat label="اعتمادات بانتظار العملاء" value={k.pendingApprovals} tone={k.pendingApprovals ? "clay" : "palm"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="الطلبات حسب المرحلة" action={<button className="text-sm text-gold" onClick={() => onNavigate("crm")}>فتح خط المبيعات</button>}>
          <ul className="space-y-3">
            {leadStages.map((s) => {
              const n = db.leads.filter((l) => l.stage === s.id).length;
              return (
                <li key={s.id} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="text-muted">{s.label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-elevated"><span className="block h-full rounded-full bg-gold" style={{ width: `${(n / maxStage) * 100}%` }} /></span>
                  <span className="text-end font-semibold">{n}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="المشاريع ومراحلها" action={<button className="text-sm text-gold" onClick={() => onNavigate("projects")}>إدارة المشاريع</button>}>
          <ul className="divide-y divide-line">
            {db.projects.slice(0, 5).map((p) => {
              const cur = p.milestones.find((m) => m.status === "current");
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">{p.entity} · {fmtDate(p.date)}</p>
                  </div>
                  <Badge tone={statusTone(p.status)}>{cur ? journey.find((j) => j.key === cur.key)?.title : "مكتمل"}</Badge>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <p className="text-xs text-muted">إدارة محتوى الموقع (معرض الأعمال والمقالات) تتم عبر نظام إدارة المحتوى (Headless CMS)، وتحليلات الزوار عبر Google Analytics و Hotjar عند ضبط معرفاتهما.</p>
    </div>
  );
}

/* ---------------------------- إدارة المشاريع ---------------------------- */
const emptyProject = { name: "", date: "", location: "", area: "", services: "", duration: "", entity: "", supervisor: "", lat: "24.7136", lng: "46.6753", radiusM: "300", clientEmail: "", reference: "" };
const projectFields: { k: keyof typeof emptyProject; label: string; ph?: string; type?: string; dir?: "ltr" }[] = [
  { k: "name", label: "اسم الفعالية", ph: "مثال: مؤتمر الذكاء الاصطناعي" },
  { k: "date", label: "تاريخ الفعالية", type: "date" },
  { k: "location", label: "الموقع", ph: "الرياض - مركز للمعارض" },
  { k: "area", label: "المساحة (م²)", ph: "5000 متر مربع" },
  { k: "services", label: "الخدمات المطلوبة", ph: "إدارة حشود، ضيافة، استقبال" },
  { k: "duration", label: "المدة", ph: "3 أيام" },
  { k: "entity", label: "الجهة المقيمة (العميل)", ph: "وزارة الاتصالات" },
  { k: "supervisor", label: "اسم المشرف / ضابط الاتصال", ph: "م. فهد القحطاني" },
  { k: "lat", label: "خط العرض (للتحضير الجغرافي)", dir: "ltr" },
  { k: "lng", label: "خط الطول", dir: "ltr" },
  { k: "radiusM", label: "نطاق التحضير (متر)", dir: "ltr" },
  { k: "clientEmail", label: "بريد العميل (اختياري)", dir: "ltr", ph: "client@company.sa" },
];

function Projects({ db, assignQr }: { db: Data; assignQr: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyProject);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [assigning, setAssigning] = useState<Project | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await api("/api/admin/projects", "POST", form);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields);
      return setMsg(r.error);
    }
    setForm(emptyProject);
    setErrors({});
    setMsg("تمت إضافة المشروع بنجاح وهو الآن قيد الدراسة من الإدارة.");
    router.refresh();
  };

  const patch = async (id: string, body: object) => {
    const r = await api(`/api/admin/projects/${id}`, "PATCH", body);
    if (r.ok) router.refresh();
    else alert(r.error);
  };

  return (
    <div className="space-y-6">
      <Panel title="إضافة مشروع جديد وتحديد متطلباته التشغيلية">
        <form onSubmit={add} noValidate className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {projectFields.map((f) => (
            <div key={f.k}>
              <label htmlFor={`p-${f.k}`} className="mb-1 block text-xs font-semibold text-muted">{f.label}</label>
              <input
                id={`p-${f.k}`}
                type={f.type ?? "text"}
                dir={f.dir}
                value={form[f.k]}
                placeholder={f.ph}
                onChange={(e) => setForm((x) => ({ ...x, [f.k]: e.target.value }))}
                className={`field py-2.5 text-sm ${f.dir ? "text-right" : ""}`}
                aria-invalid={!!errors[f.k]}
              />
              {errors[f.k] && <p className="mt-1 text-xs text-clay">{errors[f.k]}</p>}
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-end gap-4 md:col-span-3 lg:col-span-4">
            {msg && <p className={`text-sm ${Object.keys(errors).length ? "text-clay" : "text-palm"}`} role="status">{msg}</p>}
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ ودراسة المشروع"}</button>
          </div>
        </form>
      </Panel>

      <Panel title="قائمة المشاريع النشطة ومتابعة التشغيل" action={<Badge tone="gold">{db.projects.length} مشاريع مسجلة</Badge>}>
        <div className="-m-5 overflow-x-auto md:-m-6">
          <table className="w-full min-w-[960px] text-right text-sm">
            <thead className="bg-elevated text-xs text-muted">
              <tr>
                <th className="p-4 font-semibold">اسم الفعالية / الجهة</th>
                <th className="p-4 font-semibold">التاريخ والمدة</th>
                <th className="p-4 font-semibold">الموقع والمساحة</th>
                <th className="p-4 font-semibold">الخدمات والمشرف</th>
                <th className="p-4 font-semibold">حالة الدراسة والتنسيق</th>
                <th className="p-4 font-semibold">المرحلة</th>
                <th className="p-4 text-center font-semibold">إدارة واختيار الكوادر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {db.projects.map((p) => {
                const cur = p.milestones.find((m) => m.status === "current");
                return (
                  <tr key={p.id} className="align-top hover:bg-elevated/50">
                    <td className="p-4">
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-gold">{p.entity}</p>
                      {p.reference && <p className="mt-1 font-mono text-[11px] text-muted" dir="ltr">{p.reference}</p>}
                    </td>
                    <td className="p-4"><p>{fmtDate(p.date)}</p><p className="text-xs text-muted">{p.duration}</p></td>
                    <td className="p-4"><p>{p.location}</p><p className="text-xs text-muted">{p.area}</p></td>
                    <td className="max-w-[14rem] p-4"><p className="truncate" title={p.services}>{p.services}</p><p className="text-xs text-muted">المشرف: {p.supervisor}</p></td>
                    <td className="p-4">
                      <label className="sr-only" htmlFor={`st-${p.id}`}>حالة المشروع</label>
                      <select id={`st-${p.id}`} value={p.status} onChange={(e) => patch(p.id, { status: e.target.value })} className="field px-3 py-2 text-xs">
                        {projectStatuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <p className="text-xs">{cur ? journey.find((j) => j.key === cur.key)?.title : "تم التسليم"}</p>
                      {cur && <button className="mt-2 text-xs text-gold hover:underline" onClick={() => patch(p.id, { advanceMilestone: true })}>إنهاء المرحلة ←</button>}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => setAssigning(p)} className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-gold transition hover:border-gold">
                        توزيع الكوادر وإصدار QR
                      </button>
                      <p className="mt-2 text-xs text-muted">{p.assignments.length} مُسند</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <AssignModal project={assigning} staff={db.staff} assignQr={assignQr} onClose={() => setAssigning(null)} />
    </div>
  );
}

function AssignModal({ project, staff, assignQr, onClose }: { project: Project | null; staff: Staff[]; assignQr: Record<string, string>; onClose: () => void }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Staff | null>(null);
  const [role, setRole] = useState("منظم");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ token: string; name: string } | null>(null);

  const close = () => {
    setPicked(null);
    setIssued(null);
    setError("");
    onClose();
  };

  const defaults = (p: Project) => {
    setStart(`${p.date}T08:00`);
    setEnd(`${p.date}T16:00`);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!project || !picked) return;
    const r = await api<{ token: string }>(`/api/admin/projects/${project.id}/assign`, "POST", { staffId: picked.id, role, shiftStart: `${start}:00+03:00`, shiftEnd: `${end}:00+03:00` });
    if (!r.ok) return setError(Object.values(r.fields)[0] ?? r.error);
    setIssued({ token: r.data.token, name: picked.name });
    setPicked(null);
    router.refresh();
  };

  const assigned = new Set(project?.assignments.map((a) => a.staffId));

  return (
    <Modal open={!!project} onClose={close} title={<>إسناد الكوادر للفعالية: {project?.name}</>}>
      {issued ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-palm">تم اختيار {issued.name} للفعالية، وأُرسل إشعار التواصل مع بطاقة التحضير.</p>
          <QrImage value={issued.token} label={`بطاقة تحضير ${issued.name}`} />
          <p className="text-xs text-muted">رابط البطاقة الذي يصل الموظف (التحضير بالموقع الجغرافي):</p>
          <a href={`/badge/${issued.token}`} target="_blank" className="block break-all font-mono text-xs text-gold underline" dir="ltr">/badge/{issued.token}</a>
          <button className="btn-ghost" onClick={() => setIssued(null)}>إسناد موظف آخر</button>
        </div>
      ) : picked && project ? (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm">تحديد وردية <strong>{picked.name}</strong></p>
          <div>
            <label htmlFor="as-role" className="label">الدور في الفعالية</label>
            <input id="as-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} list="roles" />
            <datalist id="roles">{["منظم", "منظم حشود", "استقبال", "إرشاد الزوار", "ضيافة", "مشرف منطقة", "بروتوكول"].map((r) => <option key={r} value={r} />)}</datalist>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="as-s" className="label">بداية الوردية</label><input id="as-s" type="datetime-local" className="field" value={start} onChange={(e) => setStart(e.target.value)} required /></div>
            <div><label htmlFor="as-e" className="label">نهاية الوردية</label><input id="as-e" type="datetime-local" className="field" value={end} onChange={(e) => setEnd(e.target.value)} required /></div>
          </div>
          {error && <p className="text-sm text-clay" role="alert">{error}</p>}
          <div className="flex justify-between gap-3">
            <button type="button" className="btn-ghost" onClick={() => setPicked(null)}>رجوع</button>
            <button type="submit" className="btn-primary">إسناد وإصدار QR</button>
          </div>
        </form>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted">اختر الموظفين المؤهلين من قاعدة البيانات لتحديدهم لهذا المشروع وإرسال إشعارات التواصل وبطاقات التحضير:</p>
          <ul className="space-y-3">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-elevated p-3">
                <div>
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="text-xs text-muted">{s.education} | <span dir="ltr">{s.phone}</span></p>
                </div>
                {assigned.has(s.id) ? (
                  <a href={`/badge/${assignQr[`${project?.id}:${s.id}`] ?? ""}`} target="_blank" className="text-xs text-palm underline">مُسند — البطاقة</a>
                ) : (
                  <button className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-bg" onClick={() => { setPicked(s); if (project) defaults(project); }}>
                    اختيار وتواصل
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!staff.length && <Empty>لا يوجد موظفون مسجلون بعد.</Empty>}
        </>
      )}
    </Modal>
  );
}

/* ---------------------------- قاعدة الموظفين ---------------------------- */
function StaffPool({ staff, projects, staffQr }: { staff: Staff[]; projects: Project[]; staffQr: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [edu, setEdu] = useState("");
  const [show, setShow] = useState<Staff | null>(null);
  const list = staff.filter((s) => (!q || s.name.includes(q) || s.phone.includes(q) || s.email.includes(q.toLowerCase())) && (!edu || s.education === edu));
  const countFor = (id: string) => projects.filter((p) => p.assignments.some((a) => a.staffId === id)).length;

  return (
    <Panel
      title="قاعدة بيانات المتقدمين والموظفين المسجلين"
      action={
        <div className="flex flex-wrap gap-2">
          <input aria-label="بحث" className="field w-52 py-2 text-sm" placeholder="بحث بالاسم أو الجوال" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="المستوى التعليمي" className="field w-40 py-2 text-sm" value={edu} onChange={(e) => setEdu(e.target.value)}>
            <option value="">كل المستويات</option>
            {["الثانوية العامة", "دبلوم", "بكالوريوس", "دراسات عليا"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      }
    >
      {list.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <article key={s.id} className="flex flex-col justify-between rounded-2xl border border-line bg-elevated p-5">
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold">{s.name}</h3>
                  <Badge tone="gold">{s.education}</Badge>
                </div>
                <p className="text-xs text-muted">البريد: <span dir="ltr">{s.email}</span></p>
                <p className="text-xs text-muted">الجوال: <span dir="ltr">{s.phone}</span></p>
                <p className="mt-1 text-xs text-muted">مُسند إلى {countFor(s.id)} مشروع</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
                <span className="font-medium text-palm">● تم التحقق OTP</span>
                <button className="font-semibold text-gold hover:underline" onClick={() => setShow(s)}>عرض بطاقة QR</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty>لا توجد نتائج مطابقة.</Empty>
      )}
      <Modal open={!!show} onClose={() => setShow(null)} title="بطاقة الموظف">
        {show && (
          <div className="flex flex-col items-center text-center">
            <QrImage value={staffQr[show.id]} label={`رمز QR للموظف ${show.name}`} />
            <h4 className="mt-4 text-lg font-bold">{show.name}</h4>
            <p className="text-xs text-gold">{show.education}</p>
            <p className="text-xs text-muted" dir="ltr">{show.phone}</p>
            <p className="mt-2 text-xs text-muted">تاريخ التحقق: {fmtDateTime(show.verifiedAt)}</p>
          </div>
        )}
      </Modal>
    </Panel>
  );
}

/* ---------------------------- خط المبيعات ---------------------------- */
function Crm({ leads, projects }: { leads: Lead[]; projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<Lead | null>(null);
  const move = async (ref: string, stage: LeadStage) => {
    const r = await api(`/api/admin/leads/${ref}`, "PATCH", { stage });
    if (r.ok) router.refresh();
  };
  const convert = async (ref: string) => {
    const r = await api(`/api/admin/leads/${ref}/convert`, "POST");
    if (r.ok) {
      setOpen(null);
      router.refresh();
    } else alert(r.error);
  };
  const hasProject = (ref: string) => projects.some((p) => p.reference === ref);

  return (
    <>
      <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
        {leadStages.map((s) => {
          const col = leads.filter((l) => l.stage === s.id);
          return (
            <section key={s.id} className="min-w-[16rem] rounded-3xl border border-line bg-surface p-3">
              <header className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-sm font-bold">{s.label}</h3>
                <Badge tone={s.id === "won" ? "palm" : s.id === "lost" ? "clay" : "muted"}>{col.length}</Badge>
              </header>
              <ul className="space-y-2">
                {col.map((l) => (
                  <li key={l.reference}>
                    <button onClick={() => setOpen(l)} className="w-full rounded-2xl border border-line bg-elevated p-3 text-start transition hover:border-gold/60">
                      <p className="text-sm font-semibold">{l.organization}</p>
                      <p className="text-xs text-muted">{eventKinds.find((k) => k.id === l.kind)?.label} · {l.guests.toLocaleString("en-US")} حاضر</p>
                      <p className="mt-2 text-xs text-gold">{formatCompactSAR(l.estimate.mid)}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted" dir="ltr">{l.reference}</p>
                    </button>
                  </li>
                ))}
                {!col.length && <li className="px-2 py-6 text-center text-xs text-muted">لا يوجد</li>}
              </ul>
            </section>
          );
        })}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.organization} — ${open.reference}` : ""}>
        {open && (
          <div className="space-y-5 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["مقدم الطلب", open.name],
                ["نوع الفعالية", eventKinds.find((k) => k.id === open.kind)?.label],
                ["الحضور / الأيام", `${open.guests.toLocaleString("en-US")} / ${open.days}`],
                ["المدينة", cities.find((c) => c.id === open.city)?.label],
                ["التاريخ المتوقع", open.date],
                ["الميزانية", budgetLabels[open.budget]],
                ["التقدير", `${formatSAR(open.estimate.low)} – ${formatSAR(open.estimate.high)}`],
                ["تاريخ الاستلام", fmtDateTime(open.receivedAt)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-elevated p-3"><dt className="text-xs text-muted">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
              ))}
            </dl>
            {open.goals && <p className="rounded-2xl bg-elevated p-3 leading-7">{open.goals}</p>}
            <div className="flex flex-wrap gap-2">
              <a className="btn bg-[#25D366] px-4 py-2 text-white" target="_blank" rel="noopener noreferrer" href={whatsappLink(open.phone.replace(/^0/, "966"), `مرحبًا ${open.name}، بخصوص طلبكم رقم ${open.reference} لدى nmrievent`)}>واتساب</a>
              <a className="btn-ghost px-4 py-2" href={`mailto:${open.email}?subject=${encodeURIComponent(`طلب عرض سعر ${open.reference}`)}`}>بريد</a>
            </div>
            <div>
              <label htmlFor="stage" className="label">نقل إلى مرحلة</label>
              <select id="stage" className="field" value={open.stage} onChange={(e) => { move(open.reference, e.target.value as LeadStage); setOpen({ ...open, stage: e.target.value as LeadStage }); }}>
                {leadStages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            {hasProject(open.reference) ? (
              <p className="text-palm">هذا الطلب مرتبط بمشروع تشغيلي وبوابة عميل.</p>
            ) : (
              <button className="btn-primary w-full" onClick={() => convert(open.reference)}>تم التعاقد: تحويل إلى مشروع وفتح بوابة العميل</button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
