import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PLAYER_ROUTES = ["/home", "/my-dashboard", "/skill-tree", "/challenges"];

export default auth((req) => {
  const path = req.nextUrl.pathname;

  if (path === "/admin/login") return;

  // ── KPI: coach can do anything; a player can only GET their own ──
  if (path.startsWith("/api/kpi")) {
    const role = req.auth?.user?.role;
    if (role === "COACH_ADMIN") {
      // fall through, allowed
    } else if (role === "PLAYER" && req.method === "GET") {
      const requestedId = req.nextUrl.searchParams.get("playerId");
      if (requestedId !== req.auth?.user?.linkedPlayerId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      // matches own id, allowed
    } else {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // ── Admin routes & pages ──────────────────────────────────────
  const isAdminRoute = path.startsWith("/admin");
  const isAdminApi =
    path.startsWith("/api/admin") ||
    path.startsWith("/api/upload") ||
    path.startsWith("/api/training") ||
    path.startsWith("/api/leaderboard") ||
    path.startsWith("/api/skill-tree") ||
    (path.startsWith("/api/puzzles") &&
      !path.startsWith("/api/puzzles/today") &&
      !path.startsWith("/api/puzzles/submit") &&
      req.method !== "GET") ||
    path.startsWith("/api/badges") ||
    path.startsWith("/api/matches") ||
    path.startsWith("/api/opponents") ||
    path.startsWith("/api/tournaments") ||
    path.startsWith("/api/puzzles/mine") ||
    path.startsWith("/api/players");

  if ((isAdminRoute || isAdminApi) && req.auth?.user?.role !== "COACH_ADMIN") {
    if (isAdminApi) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.redirect(new URL("/admin/login", req.url));
  }

  // ── Player-facing puzzle API ─────────────────────────────────
  const isPlayerPuzzleApi =
    path.startsWith("/api/puzzles/today") ||
    path.startsWith("/api/puzzles/submit");
  if (isPlayerPuzzleApi && !req.auth?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Player-facing pages ───────────────────────────────────────
  const isPlayerRoute = PLAYER_ROUTES.some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  if (isPlayerRoute) {
    if (!req.auth?.user) {
      return Response.redirect(new URL("/login", req.url));
    }
    if (req.auth.user.role === "COACH_ADMIN") {
      return Response.redirect(new URL("/admin", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/players/:path*",
    "/api/admin/:path*",
    "/api/upload/:path*",
    "/api/kpi/:path*",
    "/api/training/:path*",
    "/api/skill-tree/:path*",
    "/api/puzzles/:path*",
    "/api/badges/:path*",
    "/api/matches/:path*",
    "/api/opponents/:path*",
    "/api/tournaments/:path*",
    "/api/leaderboard/:path*",
    "/home",
    "/home/:path*",
    "/my-dashboard",
    "/my-dashboard/:path*",
    "/skill-tree",
    "/skill-tree/:path*",
    "/challenges",
    "/challenges/:path*",
  ],
};
