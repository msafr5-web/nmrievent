import type { ReactNode } from "react";

export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone = "gold" }: { label: string; value: ReactNode; hint?: string; tone?: "gold" | "palm" | "clay" }) {
  const color = { gold: "text-gold", palm: "text-palm", clay: "text-clay" }[tone];
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const badgeTones = {
  gold: "border-gold/30 bg-gold/10 text-gold",
  palm: "border-palm/30 bg-palm/10 text-palm",
  clay: "border-clay/30 bg-clay/10 text-clay",
  muted: "border-line bg-elevated text-muted",
};

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeTones[tone]}`}>{children}</span>;
}

export const statusTone = (s: string): keyof typeof badgeTones =>
  s === "قيد التشغيل" ? "palm" : s === "مكتمل" ? "muted" : "gold";

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">{children}</p>;
}

export function Meter({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const tone = pct >= 90 ? "bg-clay" : pct >= 70 ? "bg-gold" : "bg-palm";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-elevated" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-700 ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ar-SA-u-nu-latn", { dateStyle: "medium", calendar: "gregory" }).format(new Date(iso));
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("ar-SA-u-nu-latn", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(iso));
export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("ar-SA-u-nu-latn", { dateStyle: "medium", timeStyle: "short", calendar: "gregory", timeZone: "Asia/Riyadh" }).format(new Date(iso));
