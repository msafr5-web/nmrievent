import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type Role } from "@/lib/session";

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** للتحقق داخل واجهات API (طبقة ثانية بعد middleware) */
export async function requireRole(...roles: Role[]) {
  const s = await getSession();
  return s && roles.includes(s.role) ? s : null;
}

const key = () => process.env.AUTH_SECRET ?? "dev-only-secret-change-me-dev-only-secret";

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * رمز QR موقّع: لا يحمل بيانات شخصية، فقط معرفات + توقيع HMAC (التزامًا بـ PDPL)
 * الصيغة: NMRI-<KIND>.<id>[.<id2>].<sig>
 */
export function signQr(kind: "STAFF" | "ASSIGN", ...ids: string[]) {
  const body = [`NMRI-${kind}`, ...ids].join(".");
  const sig = createHmac("sha256", key()).update(body).digest("base64url").slice(0, 16);
  return `${body}.${sig}`;
}

export function verifyQr(token: string): { kind: "STAFF" | "ASSIGN"; ids: string[] } | null {
  const parts = token.split(".");
  if (parts.length < 3) return null;
  const sig = parts.pop()!;
  const [head, ...ids] = parts;
  const kind = head.replace("NMRI-", "") as "STAFF" | "ASSIGN";
  if (kind !== "STAFF" && kind !== "ASSIGN") return null;
  return safeEqual(signQr(kind, ...ids).split(".").pop()!, sig) ? { kind, ids } : null;
}

export const hashOtp = (email: string, code: string) => createHash("sha256").update(`${key()}:${email}:${code}`).digest("hex");
export const generateOtp = () => String(randomInt(0, 10_000)).padStart(4, "0");
