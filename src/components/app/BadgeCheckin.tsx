"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./api";
import { PinIcon } from "../icons";

/** تسجيل الحضور والانصراف بالموقع الجغرافي من جوال الموظف */
export function BadgeCheckin({ token, radiusM, checkedIn, checkedOut }: { token: string; radiusM: number; checkedIn: boolean; checkedOut: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const action: "in" | "out" | null = !checkedIn ? "in" : !checkedOut ? "out" : null;

  const run = () => {
    if (!action) return;
    if (!("geolocation" in navigator)) return setMsg({ ok: false, text: "جهازك لا يدعم تحديد الموقع. تواصل مع المشرف للتحضير اليدوي." });
    setBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await api<{ distance: number }>("/api/checkin", "POST", { token, lat: pos.coords.latitude, lng: pos.coords.longitude, action });
        setBusy(false);
        if (!r.ok) return setMsg({ ok: false, text: r.error });
        setMsg({ ok: true, text: action === "in" ? `تم تسجيل حضورك (على بعد ${r.data.distance} م من الموقع).` : "تم تسجيل انصرافك. شكرًا لك." });
        router.refresh();
      },
      () => {
        setBusy(false);
        setMsg({ ok: false, text: "تعذر الحصول على موقعك. فعّل خدمة الموقع وامنح الإذن للمتصفح." });
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="w-full max-w-sm space-y-3 text-center">
      {action ? (
        <button type="button" onClick={run} disabled={busy} className="btn-primary w-full py-4 text-base">
          <PinIcon className="h-5 w-5" />
          {busy ? "جارٍ تحديد موقعك..." : action === "in" ? "تسجيل الحضور بالموقع" : "تسجيل الانصراف"}
        </button>
      ) : (
        <p className="text-sm text-muted">اكتمل تسجيل الحضور والانصراف لهذه الوردية.</p>
      )}
      {msg && <p className={`rounded-2xl p-3 text-sm ${msg.ok ? "bg-palm/10 text-palm" : "bg-clay/10 text-clay"}`} role="status">{msg.text}</p>}
      <p className="text-xs leading-6 text-muted">يجب أن تكون داخل نطاق {radiusM} متر من موقع الفعالية. يُستخدم موقعك لحظة التحضير فقط.</p>
    </div>
  );
}
