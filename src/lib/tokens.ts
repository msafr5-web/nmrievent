import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** رمز عشوائي (256 بت) آمن للروابط وملفات تعريف الارتباط */
export const newToken = () => randomBytes(32).toString("base64url");

/** نخزّن SHA-256 للرمز فقط؛ تسريب قاعدة البيانات لا يكشف رموزًا صالحة */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** مقارنة نصوص بزمن ثابت */
export function safeEqual(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}
