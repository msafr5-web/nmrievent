"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/server/types";
import { api } from "./api";
import { Badge, Empty, Meter, Panel, Stat, fmtDate, fmtDateTime, fmtTime } from "./ui";

type StaffMap = Record<string, { name: string; phone: string }>;

export function OpsHub({ projects, staff }: { projects: Project[]; staff: StaffMap }) {
  // الفعاليات قيد التشغيل أولًا
  const [id, setId] = useState((projects.find((p) => p.status === "قيد التشغيل") ?? projects[0])?.id ?? "");
  const project = projects.find((p) => p.id === id);
  if (!project) return <Empty>لا توجد مشاريع تشغيلية حاليًا.</Empty>;

  const a = project.assignments;
  const present = a.filter((x) => x.checkIn && !x.checkOut).length;
  const rate = a.length ? Math.round((a.filter((x) => x.checkIn).length / a.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor="prj" className="label">الفعالية</label>
          <select id="prj" className="field min-w-72" value={id} onChange={(e) => setId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtDate(p.date)}</option>)}
          </select>
        </div>
        <p className="text-sm text-muted">{project.location} · المشرف: {project.supervisor}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="الكوادر المُسندة" value={a.length} />
        <Stat label="في الموقع الآن" value={present} tone="palm" />
        <Stat label="نسبة الالتزام بالحضور" value={`${rate}%`} hint="مقارنة بالمُسندين" tone={rate >= 90 ? "palm" : "gold"} />
        <Stat label="نطاق التحضير الجغرافي" value={`${project.geo.radiusM} م`} hint={`${project.geo.lat.toFixed(4)}, ${project.geo.lng.toFixed(4)}`} />
      </div>

      <Roster project={project} staff={staff} />
      <CrowdAndParking key={project.id} project={project} />
    </div>
  );
}

function Roster({ project, staff }: { project: Project; staff: StaffMap }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const mark = async (staffId: string, action: "in" | "out") => {
    setBusy(staffId + action);
    const r = await api("/api/ops/attendance", "POST", { projectId: project.id, staffId, action });
    setBusy("");
    if (r.ok) router.refresh();
  };
  return (
    <Panel title="جدول الورديات والتحضير (Staff Rostering & Check-in)" action={<a className="text-sm text-gold" target="_blank" rel="noopener noreferrer" href={`https://maps.google.com/?q=${project.geo.lat},${project.geo.lng}`}>موقع الفعالية على الخريطة</a>}>
      {project.assignments.length ? (
        <div className="-m-5 overflow-x-auto md:-m-6">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-elevated text-xs text-muted">
              <tr>
                <th className="p-4 font-semibold">الموظف</th>
                <th className="p-4 font-semibold">الدور</th>
                <th className="p-4 font-semibold">الوردية</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">تحضير يدوي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {project.assignments.map((a) => {
                const s = staff[a.staffId];
                return (
                  <tr key={a.staffId}>
                    <td className="p-4"><p className="font-semibold">{s?.name ?? a.staffId}</p><p className="text-xs text-muted" dir="ltr">{s?.phone}</p></td>
                    <td className="p-4">{a.role}</td>
                    <td className="p-4 text-xs"><p>{fmtDate(a.shiftStart)}</p><p className="text-muted">{fmtTime(a.shiftStart)} – {fmtTime(a.shiftEnd)}</p></td>
                    <td className="p-4">
                      {a.checkOut ? (
                        <Badge>انصرف {fmtTime(a.checkOut.at)}</Badge>
                      ) : a.checkIn ? (
                        <div className="space-y-1">
                          <Badge tone="palm">حاضر {fmtTime(a.checkIn.at)}</Badge>
                          <p className="text-[11px] text-muted">{a.checkIn.method === "geo" ? `تحضير جغرافي · ${a.checkIn.distanceM} م من الموقع` : "تحضير يدوي من المشرف"}</p>
                        </div>
                      ) : (
                        <Badge tone="clay">لم يحضر</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-line px-3 py-1.5 text-xs hover:border-palm hover:text-palm disabled:opacity-40" disabled={!!a.checkIn || busy !== ""} onClick={() => mark(a.staffId, "in")}>حضور</button>
                        <button className="rounded-lg border border-line px-3 py-1.5 text-xs hover:border-clay hover:text-clay disabled:opacity-40" disabled={!a.checkIn || !!a.checkOut || busy !== ""} onClick={() => mark(a.staffId, "out")}>انصراف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>لم تُسند كوادر لهذه الفعالية بعد. يتم الإسناد من لوحة الإدارة العليا.</Empty>
      )}
      <p className="mt-6 text-xs leading-6 text-muted">
        يسجل الموظف حضوره من بطاقة التحضير على جواله، ويتحقق النظام من وجوده داخل نطاق {project.geo.radiusM} متر من موقع الفعالية (Geo-fencing). يستخدم المشرف التحضير اليدوي عند تعذر تحديد الموقع.
      </p>
    </Panel>
  );
}

/** الحشود والمواقف: قراءات محفوظة + بث محاكى إلى حين ربط الحساسات وكاميرات العد */
function CrowdAndParking({ project }: { project: Project }) {
  const router = useRouter();
  const [zones, setZones] = useState(project.zones);
  const [parking, setParking] = useState(project.parking.occupied);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setZones((zs) => zs.map((z) => ({ ...z, current: Math.max(0, Math.min(Math.round(z.capacity * 1.05), z.current + Math.round((Math.random() - 0.45) * z.capacity * 0.03))) })));
      setParking((p) => Math.max(0, Math.min(project.parking.capacity, p + Math.round((Math.random() - 0.4) * project.parking.capacity * 0.02))));
      setUpdatedAt(new Date().toISOString());
    }, 2000);
    return () => clearInterval(t);
  }, [live, project.parking.capacity]);

  const total = useMemo(() => zones.reduce((s, z) => s + z.current, 0), [zones]);
  const alerts = zones.filter((z) => z.current / z.capacity >= 0.9);

  const save = async () => {
    const r = await api(`/api/admin/projects/${project.id}`, "PATCH", { zones: zones.map((z) => ({ name: z.name, current: z.current })), parkingOccupied: parking });
    setSaved(r.ok ? "تم حفظ القراءة" : r.error);
    if (r.ok) router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel
        className="lg:col-span-2"
        title="إدارة الحشود حسب المناطق"
        action={
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--gold))]" />
              بث مباشر (محاكاة)
            </label>
            <button className="btn-ghost px-4 py-2 text-xs" onClick={save}>حفظ القراءة</button>
          </div>
        }
      >
        <p className="mb-5 text-sm text-muted" aria-live="polite">
          إجمالي الحضور في الموقع: <strong className="text-fg">{total.toLocaleString("en-US")}</strong>
          {updatedAt && <> · آخر تحديث {fmtDateTime(updatedAt)}</>}
          {saved && <> · {saved}</>}
        </p>
        <ul className="space-y-5">
          {zones.map((z) => {
            const pct = Math.round((z.current / z.capacity) * 100);
            return (
              <li key={z.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{z.name}</span>
                  <span className={pct >= 90 ? "font-bold text-clay" : "text-muted"}>{z.current.toLocaleString("en-US")} / {z.capacity.toLocaleString("en-US")} ({pct}%)</span>
                </div>
                <Meter value={z.current} max={z.capacity} />
              </li>
            );
          })}
        </ul>
        {alerts.length > 0 && (
          <p className="mt-5 rounded-2xl border border-clay/40 bg-clay/10 p-3 text-sm text-clay" role="alert">
            تنبيه طاقة استيعابية: {alerts.map((z) => z.name).join("، ")} تجاوزت 90%. فعّل خطة تحويل المسارات.
          </p>
        )}
      </Panel>
      <Panel title="المواقف الذكية (Smart Mobility)">
        <p className="font-display text-4xl font-bold text-gold">{Math.round((parking / project.parking.capacity) * 100)}%</p>
        <p className="mt-1 text-sm text-muted">{parking.toLocaleString("en-US")} من {project.parking.capacity.toLocaleString("en-US")} موقف مشغول</p>
        <div className="mt-4"><Meter value={parking} max={project.parking.capacity} /></div>
        <p className="mt-4 text-sm">المتاح: <strong className="text-palm">{(project.parking.capacity - parking).toLocaleString("en-US")}</strong></p>
        <p className="mt-6 text-xs leading-6 text-muted">تُستبدل المحاكاة ببيانات حساسات المواقف وأنظمة عد الزوار عند الربط عبر واجهة التكامل.</p>
      </Panel>
    </div>
  );
}
