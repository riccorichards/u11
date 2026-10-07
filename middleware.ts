// Path: middleware.ts
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PLAYER_ROUTES = [
  "/home",
  "/my-dashboard",
  "/skill-tree",
  "/challenges",
  "/badges",
];

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
    } else {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // ── Challenges: same self-or-admin pattern as KPI ────────────────
  if (path.startsWith("/api/challenges")) {
    const role = req.auth?.user?.role;
    if (role === "COACH_ADMIN") {
      // fall through, allowed
    } else if (role === "PLAYER" && req.method === "GET") {
      const requestedId = req.nextUrl.searchParams.get("playerId");
      if (requestedId !== req.auth?.user?.linkedPlayerId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // ── Player-facing puzzle API — never admin-gated ──────────────
  // (Old puzzle system. Remove this block in Phase 4.6 cleanup, after the migration.)
  const isPlayerPuzzleApi =
    path.startsWith("/api/puzzles/today") ||
    path.startsWith("/api/puzzles/submit") ||
    path.startsWith("/api/puzzles/mine");
  if (isPlayerPuzzleApi) {
    if (!req.auth?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // ── Admin routes & pages ──────────────────────────────────────
  // Learning APIs (/api/tasks, /api/groups, /api/modules, /api/mastery,
  // /api/assignments, /api/topics) check roles inside each route, because some
  // of them are player POSTs (answering a puzzle, starting a topic).
  const isAdminRoute = path.startsWith("/admin");
  const isAdminApi =
    path.startsWith("/api/admin") ||
    path.startsWith("/api/upload") ||
    path.startsWith("/api/training") ||
    path.startsWith("/api/leaderboard") ||
    (path.startsWith("/api/skill-tree") && req.method !== "GET") ||
    (path.startsWith("/api/puzzles") && req.method !== "GET") || // /today, /submit, /mine already returned above
    (path.startsWith("/api/badges") && req.method !== "GET") ||
    (path.startsWith("/api/matches") && req.method !== "GET") ||
    (path.startsWith("/api/opponents") && req.method !== "GET") ||
    (path.startsWith("/api/attributes") && req.method !== "GET") ||
    (path.startsWith("/api/tournaments") && req.method !== "GET") ||
    (path.startsWith("/api/players") && req.method !== "GET");

  if ((isAdminRoute || isAdminApi) && req.auth?.user?.role !== "COACH_ADMIN") {
    if (isAdminApi) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    // Signed-in players and parents go to their own home, not the admin login screen.
    if (req.auth?.user) {
      return Response.redirect(new URL("/home", req.url));
    }
    return Response.redirect(new URL("/admin/login", req.url));
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
    "/api/challenges/:path*",
    "/api/training/:path*",
    "/api/skill-tree/:path*",
    "/api/puzzles/:path*",
    "/api/badges/:path*",
    "/api/matches/:path*",
    "/api/opponents/:path*",
    "/api/tournaments/:path*",
    "/api/leaderboard/:path*",
    "/api/attributes/:path*",
    "/home",
    "/home/:path*",
    "/my-dashboard",
    "/my-dashboard/:path*",
    "/skill-tree",
    "/skill-tree/:path*",
    "/challenges",
    "/challenges/:path*",
    "/badges",
    "/badges/:path*",
  ],
};
