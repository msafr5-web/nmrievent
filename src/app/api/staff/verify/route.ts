import { hashOtp, safeEqual, signQr } from "@/server/auth";
import { mutate, newId } from "@/server/db";
import { fail, notify, ok, parse } from "@/server/http";
import { otpVerifySchema } from "@/server/schemas";
import type { Staff } from "@/server/types";

export async function POST(req: Request) {
  const p = await parse(req, otpVerifySchema);
  if ("res" in p) return p.res;
  const { email, otp } = p.data;

  const result = await mutate((db): { staff: Staff } | { error: string; status: number } => {
    const entry = db.otps.find((o) => o.email === email);
    if (!entry || entry.expiresAt < Date.now()) return { error: "انتهت صلاحية الرمز، اطلب رمزًا جديدًا.", status: 410 };
    if (entry.attempts >= 5) return { error: "تجاوزت عدد المحاولات، اطلب رمزًا جديدًا.", status: 429 };
    entry.attempts += 1;
    if (!safeEqual(entry.codeHash, hashOtp(email, otp))) return { error: "رمز التحقق غير صحيح.", status: 400 };
    const now = new Date().toISOString();
    const staff: Staff = { id: newId("stf"), ...entry.payload, verifiedAt: now, createdAt: now };
    db.staff.push(staff);
    db.otps = db.otps.filter((o) => o !== entry);
    return { staff };
  });

  if ("error" in result) return fail(result.error, result.status, { otp: result.error });
  await notify("staff.registered", { id: result.staff.id, email: result.staff.email });
  return ok({ staff: result.staff, qr: signQr("STAFF", result.staff.id) }, 201);
}
