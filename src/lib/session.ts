import { jwtVerify, SignJWT } from "jose";

/** جلسات JWT موقعة (HS256) — تعمل في الخادم وفي middleware */
export type Role = "admin" | "ops" | "client";
export type Session = { role: Role; sub: string; name: string };

export const SESSION_COOKIE = "nmri_session";
const TTL_SECONDS = 60 * 60 * 8;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");
  return new TextEncoder().encode(s ?? "dev-only-secret-change-me-dev-only-secret");
}

export async function signSession(session: Session) {
  return new SignJWT({ role: session.role, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const role = payload.role as Role;
    if (!["admin", "ops", "client"].includes(role) || !payload.sub) return null;
    return { role, sub: payload.sub, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

export const sessionCookie = (value: string) => ({
  name: SESSION_COOKIE,
  value,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_SECONDS,
});

/** الصلاحيات المطلوبة لكل قسم */
export const areaRoles: Record<string, Role[]> = {
  "/admin": ["admin"],
  "/ops": ["admin", "ops"],
  "/portal": ["admin", "client"],
};
