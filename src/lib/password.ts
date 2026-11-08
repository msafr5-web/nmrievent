import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * تجزئة كلمات السر بـ scrypt (ذاكرة 64MB). الصيغة: scrypt$N$r$p$salt$hash (base64url).
 * المعاملات مخزّنة مع التجزئة فيمكن رفعها لاحقًا دون كسر كلمات السر القديمة.
 */
const PARAMS = { N: 2 ** 16, r: 8, p: 1, keylen: 64 } as const;
const MAX_MEM = 256 * 1024 * 1024;

const derive = (password: string, salt: Buffer, N: number, r: number, p: number, keylen: number) =>
  new Promise<Buffer>((resolve, reject) => {
    const opts: ScryptOptions = { N, r, p, maxmem: MAX_MEM };
    scryptCb(password.normalize("NFKC"), salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS.N, PARAMS.r, PARAMS.p, PARAMS.keylen);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  try {
    const actual = await derive(password, Buffer.from(saltB64, "base64url"), Number(n), Number(r), Number(p), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** تجزئة وهمية للمقارنة عند عدم وجود المستخدم، فلا يُكشف وجود الحساب من زمن الاستجابة */
let dummy: Promise<string> | undefined;
export const dummyHash = () => (dummy ??= hashPassword("nmr-dummy-password-for-timing"));

export type PasswordIssue = "short" | "long" | "weak" | "same-as-email";

/** سياسة كلمة السر: 12 حرفًا على الأقل، حروف وأرقام، وليست البريد أو حرفًا مكررًا */
export function checkPassword(password: string, email?: string): PasswordIssue | null {
  if (password.length < 12) return "short";
  if (password.length > 128) return "long";
  if (email && password.toLowerCase() === email.toLowerCase()) return "same-as-email";
  if (!/[A-Za-z؀-ۿ]/.test(password) || !/\d/.test(password)) return "weak";
  if (new Set(password).size < 5) return "weak";
  return null;
}

export const passwordIssueMessage: Record<PasswordIssue, string> = {
  short: "كلمة السر قصيرة: 12 حرفًا على الأقل.",
  long: "كلمة السر طويلة جدًا.",
  weak: "كلمة السر ضعيفة: استخدم حروفًا وأرقامًا متنوعة.",
  "same-as-email": "لا يجوز أن تكون كلمة السر هي البريد الإلكتروني.",
};
