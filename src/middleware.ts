import { NextRequest, NextResponse } from "next/server";

// Cookie names — must match customer-session.ts, admin-session.ts, agent-session.ts
const CUSTOMER_COOKIE = "etx_cust";
const ADMIN_COOKIE = "etx_admin";
const AGENT_COOKIE = "etx_agent";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes — one login page. Unauthenticated admins are sent to /sign-in
  // (the /admin/login path is kept only as a self-redirect to /sign-in).
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.has(ADMIN_COOKIE)) {
      return NextResponse.redirect(new URL("/sign-in?redirect_url=/admin", req.url));
    }
    return NextResponse.next();
  }

  // Agent portal routes — require an agent session. Status/approval gating is
  // enforced server-side by requireApprovedAgent; this is the fast edge check.
  if (pathname.startsWith("/agent")) {
    if (!req.cookies.has(AGENT_COOKIE)) {
      const redirect = encodeURIComponent(pathname + req.nextUrl.search);
      return NextResponse.redirect(new URL(`/login?redirect_url=${redirect}`, req.url));
    }
    return NextResponse.next();
  }

  // Customer account routes
  if (pathname.startsWith("/account")) {
    if (!req.cookies.has(CUSTOMER_COOKIE)) {
      const redirect = encodeURIComponent(pathname + req.nextUrl.search);
      return NextResponse.redirect(new URL(`/sign-in?redirect_url=${redirect}`, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
