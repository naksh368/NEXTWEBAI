import { NextRequest, NextResponse } from "next/server";

// Cookie names — must match customer-session.ts and admin-session.ts
const CUSTOMER_COOKIE = "etx_cust";
const ADMIN_COOKIE = "etx_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes — protect everything except the login page itself
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.has(ADMIN_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
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
