import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/packages(.*)",
  "/destinations(.*)",
  "/offers(.*)",
  "/travel-guide(.*)",
  "/legal(.*)",
  "/support(.*)",
  "/ai(.*)",
  "/api/pricing(.*)",
  "/api/assistant(.*)",
  "/sitemap.xml",
  "/robots.txt",
  "/admin(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
