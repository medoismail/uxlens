import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/audit(.*)",
  "/api/chat(.*)",
  "/api/audits(.*)",
  "/api/keys(.*)",
]);

// Extension routes handle their own Bearer token auth — skip Clerk protection
const isExtensionRoute = createRouteMatcher([
  "/api/extension(.*)",
  "/extension(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Extension routes use Bearer token auth, not Clerk session
  if (isExtensionRoute(req)) return;

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
