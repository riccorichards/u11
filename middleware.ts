import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // The login page itself must stay reachable while logged out
  if (path === "/admin/login") return;

  const isAdminRoute = path.startsWith("/admin");

  const isAdminApi =
    path.startsWith("/api/admin") ||
    path.startsWith("/api/upload") ||
    (path.startsWith("/api/players") && req.method !== "GET");

  if ((isAdminRoute || isAdminApi) && req.auth?.user?.role !== "COACH_ADMIN") {
    if (isAdminApi) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.redirect(new URL("/admin/login", req.url));
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/players/:path*",
    "/api/admin/:path*",
    "/api/upload/:path*",
  ],
};
