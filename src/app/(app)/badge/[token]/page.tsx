import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheckin } from "@/components/app/BadgeCheckin";
import { QrImage } from "@/components/app/QrImage";
import { Badge, fmtDate, fmtTime } from "@/components/app/ui";
import { Logo } from "@/components/Logo";
import { verifyQr } from "@/server/auth";
import { read } from "@/server/db";

export const metadata: Metadata = { title: "بطاقة التحضير" };
export const dynamic = "force-dynamic";

/** بطاقة الموظف الرقمية: رابط موقّع يصل الموظف عند إسناده لفعالية */
export default async function BadgePage({ params }: { params: Promise<{ token: string }> }) {
  const token = decodeURIComponent((await params).token);
  const t = verifyQr(token);
  if (!t) notFound();
  const db = await read();
  const staffId = t.kind === "STAFF" ? t.ids[0] : t.ids[1];
  const staff = db.staff.find((s) => s.id === staffId);
  const project = t.kind === "ASSIGN" ? db.projects.find((p) => p.id === t.ids[0]) : undefined;
  const assignment = project?.assignments.find((a) => a.staffId === staffId);
  if (!staff || (t.kind === "ASSIGN" && !assignment)) notFound();

  return (
    <main id="main" className="flex min-h-screen flex-col items-center gap-6 px-4 py-10">
      <Logo />
      <article className="card w-full max-w-sm overflow-hidden text-center">
        <div className="sadu h-3" aria-hidden />
        <div className="p-6">
          <p className="text-xs text-muted">{project ? "بطاقة تحضير الفعالية" : "بطاقة الكادر الميداني"}</p>
          <div className="mt-4 flex justify-center"><QrImage value={token} label={`رمز QR للموظف ${staff.name}`} /></div>
          <h1 className="mt-4 text-xl font-bold">{staff.name}</h1>
          <p className="text-xs font-semibold text-gold">{assignment?.role ?? staff.education}</p>
          {project && assignment && (
            <dl className="mt-5 space-y-2 rounded-2xl bg-elevated p-4 text-start text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">الفعالية</dt><dd className="font-semibold">{project.name}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">الموقع</dt><dd>{project.location}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">الوردية</dt><dd>{fmtDate(assignment.shiftStart)} · {fmtTime(assignment.shiftStart)}–{fmtTime(assignment.shiftEnd)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">المشرف</dt><dd>{project.supervisor}</dd></div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">الحالة</dt>
                <dd>{assignment.checkOut ? <Badge>انصرف</Badge> : assignment.checkIn ? <Badge tone="palm">حاضر</Badge> : <Badge tone="clay">لم يُسجَّل الحضور</Badge>}</dd>
              </div>
            </dl>
          )}
        </div>
      </article>
      {project && assignment && (
        <BadgeCheckin token={token} radiusM={project.geo.radiusM} checkedIn={!!assignment.checkIn} checkedOut={!!assignment.checkOut} />
      )}
    </main>
  );
}
