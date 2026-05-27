// proxy.ts — Next.js 16 edge proxy (equivalent to middleware in older versions)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_KEYS } from "@/config/constants";
import { UI_ROUTES } from "@/config/routes";

const PUBLIC_PATHS = [UI_ROUTES.LOGIN, "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.get(COOKIE_KEYS.SESSION_FLAG)?.value === "1";

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL(UI_ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasSession) {
    return NextResponse.redirect(new URL(UI_ROUTES.CHAT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};

export default proxy;
