"use client";

import { useState, type FormEvent } from "react";
import { APPLICATION_STATUSES, kindLabels, statusLabels, statusPublicText, type ApplicationKind, type ApplicationStatus } from "@/lib/applications-shared";

type Result = {
  reference: string;
  kind: ApplicationKind;
  name: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  notes: { kind: "public" | "applicant"; body: string; createdAt: string }[];
};

const when = (d: string) => new Date(d).toLocaleString("ar-SA-u-nu-latn", { dateStyle: "medium", timeStyle: "short" });
const steps: ApplicationStatus[] = ["new", "under_review", "approved"];

/** متابعة الطلب برقمه ورقم الجوال المسجَّل، مع إمكانية الرد عند طلب الاستكمال */
export function StatusLookup({ initialRef = "" }: { initialRef?: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [creds, setCreds] = useState<{ reference: string; phone: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [replyMsg, setReplyMsg] = useState("");

  async function load(reference: string, phone: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/application-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, phone }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(null);
        setError(data.fields?.reference ?? data.fields?.phone ?? data.error ?? "تعذر جلب الحالة.");
        return;
      }
      setResult(data);
      setCreds({ reference, phone });
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setReplyMsg("");
    void load(String(fd.get("reference") ?? "").trim(), String(fd.get("phone") ?? "").trim());
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!creds) return;
    setBusy(true);
    setReplyMsg("");
    try {
      const res = await fetch("/api/application-status/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...creds, message: reply }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyMsg(data.fields?.message ?? data.error ?? "تعذر إرسال الرد.");
        return;
      }
      setReply("");
      await load(creds.reference, creds.phone);
      setReplyMsg("تم إرسال ردك، وسيراجعه الفريق.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form onSubmit={onSubmit} className="card space-y-5 p-6 md:p-8">
        <div>
          <label htmlFor="reference" className="label">رقم الطلب</label>
          <input id="reference" name="reference" required defaultValue={initialRef} placeholder="STF-26-XXXXXX" dir="ltr" autoComplete="off" className="field uppercase" />
        </div>
        <div>
          <label htmlFor="phone" className="label">رقم الجوال المسجَّل في الطلب</label>
          <input id="phone" name="phone" type="tel" required placeholder="05XXXXXXXX" dir="ltr" autoComplete="tel" className="field" />
        </div>
        {error && <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy && !result ? "جارٍ البحث…" : "عرض الحالة"}</button>
      </form>

      {result && (
        <section className="card space-y-6 p-6 md:p-8" aria-live="polite" aria-label="حالة الطلب">
          <div>
            <p className="text-sm text-muted">{kindLabels[result.kind]} — <span dir="ltr">{result.reference}</span></p>
            <h2 className="mt-1 text-2xl font-bold">{statusLabels[result.status]}</h2>
            <p className="mt-2 leading-8 text-muted">{statusPublicText[result.status]}</p>
            <p className="mt-2 text-xs text-muted">قُدّم في {when(result.createdAt)} · آخر تحديث {when(result.updatedAt)}</p>
          </div>

          {result.status !== "rejected" && result.status !== "needs_info" && (
            <ol className="grid grid-cols-3 gap-2 text-center text-xs" aria-label="مراحل الطلب">
              {steps.map((s, i) => {
                const reached = APPLICATION_STATUSES.indexOf(result.status) >= APPLICATION_STATUSES.indexOf(s);
                return (
                  <li key={s} className={`rounded-xl border px-2 py-3 ${reached ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted"}`}>
                    {i + 1}. {statusLabels[s]}
                  </li>
                );
              })}
            </ol>
          )}

          {result.notes.length > 0 && (
            <div>
              <h3 className="mb-3 font-bold">الرسائل</h3>
              <ol className="space-y-3">
                {result.notes.map((n, i) => (
                  <li key={i} className={`rounded-2xl border p-4 ${n.kind === "public" ? "border-brand/40 bg-brand/5" : "border-line bg-elevated"}`}>
                    <p className="mb-1 text-xs text-muted">{n.kind === "public" ? "من فريق NMR Events" : "ردّك"} · {when(n.createdAt)}</p>
                    <p className="whitespace-pre-wrap leading-8">{n.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.status === "needs_info" && (
            <form onSubmit={onReply} className="space-y-3 border-t border-line pt-5">
              <label htmlFor="reply" className="label">ردّك على الملاحظات</label>
              <textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} required minLength={5} maxLength={1500} className="field" />
              <button type="submit" disabled={busy} className="btn-primary">{busy ? "جارٍ الإرسال…" : "إرسال الرد"}</button>
            </form>
          )}
          {replyMsg && <p role="status" className="text-sm text-brand">{replyMsg}</p>}
        </section>
      )}
    </div>
  );
}
