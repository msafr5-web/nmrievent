import Link from "next/link";
import type { ReactNode } from "react";
import { APPLICATION_STATUSES, statusLabels, type ApplicationStatus } from "@/lib/applications-shared";

const statusStyle: Record<ApplicationStatus, string> = {
  new: "bg-brand/15 text-brand",
  under_review: "bg-violet/15 text-violet dark:text-[#b79cff]",
  needs_info: "bg-sand/20 text-sand",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-danger/15 text-danger",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>{statusLabels[status]}</span>;
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl leading-8 text-muted">{lead}</p>}
      </div>
      {actions}
    </header>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "danger"; children: ReactNode }) {
  const t = { info: "border-line bg-elevated", warn: "border-sand/50 bg-sand/10", danger: "border-danger/40 bg-danger/10 text-danger" }[tone];
  return <div role={tone === "danger" ? "alert" : "status"} className={`mb-6 rounded-2xl border p-4 text-sm leading-7 ${t}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-10 text-center text-muted">{children}</div>;
}

export function Stat({ label, value, href, tone }: { label: string; value: number | string; href?: string; tone?: "brand" }) {
  const inner = (
    <div className={`card h-full p-5 transition ${href ? "hover:border-brand" : ""}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 font-display text-4xl font-bold ${tone === "brand" ? "text-brand" : ""}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/** ترقيم الصفحات بروابط GET (يحافظ على باقي معاملات البحث) */
export function Pagination({ page, total, pageSize, basePath, params }: { page: number; total: number; pageSize: number; basePath: string; params?: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="ترقيم الصفحات">
      {page > 1 && <Link className="btn-ghost" href={href(page - 1)}>السابق</Link>}
      <span className="text-muted">صفحة {page} من {pages} ({total} نتيجة)</span>
      {page < pages && <Link className="btn-ghost" href={href(page + 1)}>التالي</Link>}
    </nav>
  );
}

/** شريط بحث وفلترة بطريقة GET */
export function ApplicationFilters({ q, status, action }: { q?: string; status?: string; action: string }) {
  return (
    <form method="get" action={action} className="mb-6 flex flex-col gap-3 sm:flex-row" role="search">
      <input name="q" defaultValue={q} placeholder="بحث بالاسم أو الجوال أو البريد أو رقم الطلب" className="field flex-1" aria-label="بحث" />
      <select name="status" defaultValue={status ?? ""} className="field sm:w-56" aria-label="الحالة">
        <option value="">كل الحالات</option>
        {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
      </select>
      <button type="submit" className="btn-primary">تطبيق</button>
    </form>
  );
}

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("ar-SA-u-nu-latn", { dateStyle: "medium", timeStyle: "short" }) : "—";
