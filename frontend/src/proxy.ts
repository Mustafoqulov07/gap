import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistik tekshiruv: sessiya cookie'si bor-yo'qligiga qarab yo'naltiradi.
// Haqiqiy avtorizatsiyani backend bajaradi.
const PROTECTED = ["/dashboard", "/gaps", "/profile", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession =
    request.cookies.has("refreshToken") || request.cookies.has("accessToken");

  if (!hasSession && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gaps/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
