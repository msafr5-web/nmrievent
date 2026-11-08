import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ApplicationFilters, Empty, PageHeader, Pagination, StatusBadge, fmtDate } from "@/components/admin/ui";
import { describePayload, whatsappMessage, whatsappNumber } from "@/lib/application-display";
import { APPLICATION_STATUSES, kindLabels, statusLabels, type ApplicationKind, type ApplicationStatus } from "@/lib/applications-shared";
import { applicationPermission, applicationSegment, hasPermission } from "@/lib/permissions";
import { whatsappLink } from "@/lib/rfq-shared";
import type { ApplicationNote, ApplicationRecord } from "@/server/admin/applications";
import type { AdminUser } from "@/server/admin/users";
import { decideAction, deleteApplicationAction, noteAction } from "@/app/(admin)/admin/actions";

const titles: Record<ApplicationKind, { title: string; lead: string }> = {
  staff: { title: "طلبات التوظيف", lead: "طلبات الانضمام للكوادر الميدانية (مضيفون ومنظمون وأمن وغيرهم). راجع الطلب ثم اقبله أو أرسل ملاحظات للمتقدم." },
  exhibition: { title: "طلبات المعارض", lead: "طلبات الجهات الراغبة بالمشاركة في معرض وتصميم/تنفيذ جناحها. راجع الطلب ثم اقبله أو أرسل ملاحظات." },
};

export function ApplicationList({ kind, data, q, status }: { kind: ApplicationKind; data: { rows: ApplicationRecord[]; total: number; page: number; pageSize: number }; q?: string; status?: string }) {
  const base = `/admin/${applicationSegment(kind)}`;
  return (
    <>
      <PageHeader title={titles[kind].title} lead={titles[kind].lead} />
      <ApplicationFilters q={q} status={status} action={base} />
      {data.rows.length === 0 ? (
        <Empty>لا توجد طلبات مطابقة.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                {["رقم الطلب", kind === "staff" ? "المتقدم" : "الجهة / المسؤول", "الجوال", kind === "staff" ? "الأدوار" : "المعرض", "الحالة", "التاريخ"].map((h) => (
                  <th key={h} className="p-4 text-start font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((a) => (
                <tr key={a.reference} className="border-b border-line last:border-0 hover:bg-elevated/60">
                  <td className="p-4 font-mono text-xs" dir="ltr"><Link className="font-semibold text-brand hover:underline" href={`${base}/${a.reference}`}>{a.reference}</Link></td>
                  <td className="p-4">{kind === "exhibition" && a.org ? <><span className="font-semibold">{a.org}</span><br /><span className="text-muted">{a.name}</span></> : a.name}</td>
                  <td className="p-4" dir="ltr">{a.phone}</td>
                  <td className="max-w-[16rem] truncate p-4 text-muted">{a.summary}</td>
                  <td className="p-4"><StatusBadge status={a.status} /></td>
                  <td className="whitespace-nowrap p-4 text-muted">{fmtDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data.page} total={data.total} pageSize={data.pageSize} basePath={base} params={{ q, status }} />
    </>
  );
}

const noteStyle: Record<ApplicationNote["kind"], { label: string; cls: string }> = {
  public: { label: "رسالة للمتقدم", cls: "border-brand/40 bg-brand/5" },
  applicant: { label: "رد المتقدم", cls: "border-violet/40 bg-violet/5" },
  internal: { label: "ملاحظة داخلية", cls: "border-line bg-elevated" },
};

const decisionOptions: { id: ApplicationStatus; hint: string }[] = [
  { id: "under_review", hint: "بدء المراجعة" },
  { id: "needs_info", hint: "إرسال ملاحظات للمتقدم (تتطلب رسالة)" },
  { id: "approved", hint: "قبول الطلب" },
  { id: "rejected", hint: "رفض الطلب" },
];

export function ApplicationDetail({ kind, application: a, notes, user, origin }: { kind: ApplicationKind; application: ApplicationRecord; notes: ApplicationNote[]; user: AdminUser; origin: string }) {
  const base = `/admin/${applicationSegment(kind)}`;
  const canReview = hasPermission(user, applicationPermission(kind, "review"));
  const canDelete = hasPermission(user, applicationPermission(kind, "delete"));
  const rows = describePayload(kind, a.payload);
  const lastPublic = [...notes].reverse().find((n) => n.kind === "public")?.body;
  const wa = whatsappLink(
    whatsappNumber(a.phone),
    whatsappMessage({ name: a.name, reference: a.reference, status: a.status, note: lastPublic, statusUrl: `${origin}/application-status?ref=${a.reference}` }),
  );

  return (
    <>
      <PageHeader
        title={`${kindLabels[kind]}`}
        lead={`رقم الطلب ${a.reference}`}
        actions={<Link href={base} className="btn-ghost">← القائمة</Link>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="applicant">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="applicant" className="text-2xl font-bold">{kind === "exhibition" && a.org ? a.org : a.name}</h2>
                {kind === "exhibition" && a.org && <p className="mt-1 text-muted">المسؤول: {a.name}</p>}
              </div>
              <StatusBadge status={a.status} />
            </div>
            <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">الجوال</dt><dd dir="ltr" className="font-semibold">{a.phone}</dd></div>
              <div><dt className="text-muted">البريد الإلكتروني</dt><dd dir="ltr" className="font-semibold break-all">{a.email}</dd></div>
              <div><dt className="text-muted">تاريخ التقديم</dt><dd>{fmtDate(a.createdAt)}</dd></div>
              <div><dt className="text-muted">آخر مراجعة</dt><dd>{a.reviewedAt ? `${fmtDate(a.reviewedAt)} — ${a.reviewedByName ?? ""}` : "لم تُراجع"}</dd></div>
              <div><dt className="text-muted">موافقة الخصوصية</dt><dd>{fmtDate(a.consentAt)} (إصدار {a.policyVersion})</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:opacity-90">إرسال واتساب للمتقدم</a>
              <a href={`mailto:${a.email}?subject=${encodeURIComponent(`بخصوص طلبك ${a.reference}`)}`} className="btn-ghost">مراسلة بالبريد</a>
              {kind === "staff" && a.attachment && hasPermission(user, "staff.view") && (
                <a href={`/api/admin/applications/${a.reference}/cv`} className="btn-ghost">تنزيل السيرة الذاتية (PDF)</a>
              )}
            </div>
          </section>

          <section className="card p-6" aria-labelledby="data">
            <h2 id="data" className="text-xl font-bold">بيانات الطلب</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {rows.map((r) => (
                <div key={r.label} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                  <dt className="text-muted">{r.label}</dt>
                  <dd className="whitespace-pre-wrap leading-7">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-6" aria-labelledby="timeline">
            <h2 id="timeline" className="text-xl font-bold">السجل والملاحظات</h2>
            {notes.length === 0 ? (
              <p className="mt-4 text-muted">لا ملاحظات بعد.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className={`rounded-2xl border p-4 ${noteStyle[n.kind].cls}`}>
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span className="font-semibold">{noteStyle[n.kind].label}{n.authorName ? ` — ${n.authorName}` : ""}</span>
                      <time>{fmtDate(n.createdAt)}</time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
            {canReview && (
              <div className="mt-6 border-t border-line pt-5">
                <ActionForm action={noteAction} submit="إضافة ملاحظة داخلية" variant="ghost" className="space-y-3" resetOnSuccess>
                  <input type="hidden" name="ref" value={a.reference} />
                  <label htmlFor="body" className="label">ملاحظة داخلية (لا تظهر للمتقدم)</label>
                  <textarea id="body" name="body" rows={2} required minLength={2} maxLength={2000} className="field" />
                </ActionForm>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="card p-6" aria-labelledby="decision">
            <h2 id="decision" className="text-xl font-bold">القرار</h2>
            {canReview ? (
              <ActionForm action={decideAction} submit="حفظ القرار" className="mt-4 space-y-4">
                <input type="hidden" name="ref" value={a.reference} />
                <div>
                  <label htmlFor="status" className="label">الحالة</label>
                  <select id="status" name="status" defaultValue={a.status === "new" ? "under_review" : a.status} className="field">
                    {decisionOptions.map((o) => <option key={o.id} value={o.id}>{statusLabels[o.id]} — {o.hint}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="publicNote" className="label">رسالة تظهر للمتقدم (اختياري، مطلوبة عند طلب الاستكمال)</label>
                  <textarea id="publicNote" name="publicNote" rows={4} maxLength={2000} className="field" placeholder="مثال: نرجو إرفاق شهادة الخبرة أو توضيح أوقات التفرغ." />
                </div>
                <div>
                  <label htmlFor="internalNote" className="label">ملاحظة داخلية (اختياري)</label>
                  <textarea id="internalNote" name="internalNote" rows={2} maxLength={2000} className="field" />
                </div>
              </ActionForm>
            ) : (
              <p className="mt-3 text-sm text-muted">لديك صلاحية العرض فقط. الحالة الحالية: {statusLabels[a.status]}.</p>
            )}
            <p className="mt-4 text-xs leading-6 text-muted">
              الحالات: {APPLICATION_STATUSES.map((s) => statusLabels[s]).join(" · ")}. يتابع المتقدم حالته ويرى رسائلك من صفحة «متابعة الطلب» برقم الطلب ورقم جواله.
            </p>
          </section>

          {canDelete && (
            <form action={deleteApplicationAction} className="card border-danger/40 p-6">
              <h2 className="text-lg font-bold text-danger">حذف الطلب</h2>
              <p className="mt-2 text-sm leading-7 text-muted">حذف نهائي لبيانات المتقدم وسيرته الذاتية (مثلًا عند طلبه حذف بياناته). لا يمكن التراجع.</p>
              <input type="hidden" name="ref" value={a.reference} />
              <div className="mt-4"><ConfirmButton message="حذف هذا الطلب وبيانات المتقدم نهائيًا؟">حذف نهائي</ConfirmButton></div>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
