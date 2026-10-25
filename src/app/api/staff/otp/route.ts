import { generateOtp, hashOtp } from "@/server/auth";
import { mutate } from "@/server/db";
import { clientIp, fail, limited, notify, ok, parse } from "@/server/http";
import { staffSchema } from "@/server/schemas";
import type { Education } from "@/server/types";

const TTL_MS = 10 * 60_000;
/** في وضع العرض يُعاد الرمز في الاستجابة لغياب مزود بريد — يُعطَّل في الإنتاج */
const demoMode = () => process.env.OTP_DEMO_MODE === "true" || process.env.NODE_ENV !== "production";

export async function POST(req: Request) {
  if (limited(`otp:${clientIp(req)}`, 5, 15 * 60_000)) return fail("طلبات كثيرة لرمز التحقق، حاول بعد قليل.", 429);
  const p = await parse(req, staffSchema);
  if ("res" in p) return p.res;
  const data = { ...p.data, education: p.data.education as Education };

  const code = generateOtp();
  const exists = await mutate((db) => {
    if (db.staff.some((s) => s.email === data.email)) return true;
    db.otps = db.otps.filter((o) => o.email !== data.email && o.expiresAt > Date.now());
    db.otps.push({ email: data.email, codeHash: hashOtp(data.email, code), expiresAt: Date.now() + TTL_MS, attempts: 0, payload: data });
    return false;
  });
  if (exists) return fail("هذا البريد مسجل مسبقًا في قاعدة الكوادر.", 409, { email: "البريد مسجل مسبقًا" });

  const sent = await notify("staff.otp", { email: data.email, name: data.name, code });
  return ok({ sent: true, expiresInSec: TTL_MS / 1000, ...(demoMode() && !sent ? { demoCode: code } : {}) });
}
