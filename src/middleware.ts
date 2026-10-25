import { NextResponse, type NextRequest } from "next/server";
import { areaRoles, SESSION_COOKIE, verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const area = Object.keys(areaRoles).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!area) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session && areaRoles[area].includes(session.role)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/ops/:path*", "/portal/:path*"] };
