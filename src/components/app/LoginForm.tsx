"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "./api";

const roles = [
  { id: "client", label: "بوابة العملاء", hint: "ادخل برقم الطلب والبريد المسجل في طلب العرض.", home: "/portal" },
  { id: "ops", label: "الفرق الميدانية", hint: "لمشرفي العمليات وإدارة الكوادر في الموقع.", home: "/ops" },
  { id: "admin", label: "الإدارة العليا", hint: "إدارة المشاريع والكوادر وخط المبيعات.", home: "/admin" },
] as const;

type RoleId = (typeof roles)[number]["id"];

export function LoginForm({ showDemo }: { showDemo: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const initial: RoleId = next?.startsWith("/admin") ? "admin" : next?.startsWith("/ops") ? "ops" : "client";
  const [role, setRole] = useState<RoleId>(initial);
  const [password, setPassword] = useState("");
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = roles.find((r) => r.id === role)!;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = role === "client" ? { role, reference, email } : { role, password };
    const r = await api("/api/auth/login", "POST", body);
    setBusy(false);
    if (!r.ok) return setError(Object.values(r.fields)[0] ?? r.error);
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : current.home);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card w-full max-w-md p-6 md:p-8">
      <div role="tablist" aria-label="نوع الحساب" className="grid grid-cols-3 gap-1 rounded-2xl bg-elevated p-1">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={role === r.id}
            onClick={() => { setRole(r.id); setError(""); }}
            className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${role === r.id ? "bg-gold text-bg" : "text-muted hover:text-fg"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted">{current.hint}</p>
      <div className="mt-6 space-y-5">
        {role === "client" ? (
          <>
            <div>
              <label htmlFor="ref" className="label">رقم الطلب</label>
              <input id="ref" className="field text-right font-display" dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="NMR-26-XXXXX" required />
            </div>
            <div>
              <label htmlFor="em" className="label">البريد الإلكتروني</label>
              <input id="em" type="email" className="field text-right" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="pw" className="label">كلمة المرور</label>
            <input id="pw" type="password" className="field" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
        )}
      </div>
      {error && <p className="mt-5 rounded-2xl bg-clay/10 p-3 text-sm text-clay" role="alert">{error}</p>}
      <button type="submit" className="btn-primary mt-6 w-full py-3.5" disabled={busy}>{busy ? "جارٍ الدخول..." : "دخول"}</button>
      {showDemo && (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-4 text-xs leading-6 text-muted">
          <p className="font-semibold text-fg">بيانات العرض التجريبي</p>
          <p>العميل: <span dir="ltr">NMR-26-DEMO1</span> / <span dir="ltr">client@example.com</span></p>
          <p>الفرق الميدانية: <span dir="ltr">ops123</span> — الإدارة العليا: <span dir="ltr">admin123</span></p>
        </div>
      )}
    </form>
  );
}
