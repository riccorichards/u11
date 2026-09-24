"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";

const NAV_SECTIONS = [
  { href: "/admin/players", label: "Roster" },
  { href: "/admin/training-log", label: "Training Log" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/skill-tree-builder", label: "Skill Tree" },
  { href: "/admin/content-manager", label: "Content Manager" },
  {
    href: "/admin/assessments",
    label: "Monthly Assessment",
    desc: "Physical, technical, tactical, mental ratings",
    ready: true,
  },
  { href: "/admin/leaderboard", label: "Full Leaderboard" },
];

export default function AdminHome() {
  const [team, setTeam] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/tournaments").then((r) => r.json()),
    ]).then(([teamData, lb, p, t]) => {
      setTeam(teamData);
      setLeaderboard(lb);
      setPlayers(p);
      setTournaments(t);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <p className="p-6 font-body text-sm text-sky/60">Loading team state…</p>
    );
  }

  const s = team.stats;
  const unclaimed = players.filter((p) => !p.inviteCodeClaimed);
  const today = new Date().toISOString().slice(0, 10);
  const activeTournament = tournaments.find(
    (t) =>
      !t.result && t.startDate <= today && (!t.endDate || t.endDate >= today),
  );
  const upcomingTournament = !activeTournament
    ? tournaments
        .filter((t) => !t.result && t.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    : null;

  const byXp = [...leaderboard].sort((a, b) => b.pts - a.pts);

  const daysSinceActive = (date: string | null) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold text-mist">
        Coach Dashboard
      </h1>
      <p className="mt-1 font-body text-sm text-sky/60">Dinamo Batumi U11</p>

      {/* Top row: Team Pulse + Season Snapshot + Pending */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-4">
          <p className="font-body text-xs uppercase tracking-wide text-sky">
            Team Pulse
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="font-display text-2xl font-bold text-mist">
                {Math.round(team.condition.trainingCondition * 100)}%
              </p>
              <p className="font-body text-xs text-sky/60">Condition</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-mist">
                {Math.round(team.condition.mentalityScore * 100)}%
              </p>
              <p className="font-body text-xs text-sky/60">Mentality</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-4">
          <p className="font-body text-xs uppercase tracking-wide text-sky">
            Season
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="font-display text-2xl font-bold text-mist">
                {s.wins}-{s.draws}-{s.losses}
              </p>
              <p className="font-body text-xs text-sky/60">W-D-L</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-mist">
                {s.totalGoals}:{s.receivedGoals}
              </p>
              <p className="font-body text-xs text-sky/60">Goals</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-mist">
                {team.teamworkScore}%
              </p>
              <p className="font-body text-xs text-sky/60">Teamwork</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-mist">
                {team.totalBadgesAwarded}
              </p>
              <p className="font-body text-xs text-sky/60">Badges Won</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-4">
          <p className="font-body text-xs uppercase tracking-wide text-sky">
            Needs Attention
          </p>
          <div className="mt-3 space-y-2">
            {unclaimed.length > 0 && (
              <Link
                href="/admin/players"
                className="block font-body text-sm text-[#E0A72F] hover:underline"
              >
                {unclaimed.length} unclaimed invite code
                {unclaimed.length !== 1 ? "s" : ""}
              </Link>
            )}
            {activeTournament && (
              <Link
                href={`/admin/tournaments/${activeTournament._id}`}
                className="block font-body text-sm text-mist hover:text-ocean"
              >
                🏆 {activeTournament.name} is live
              </Link>
            )}
            {upcomingTournament && (
              <Link
                href="/admin/tournaments"
                className="block font-body text-sm text-sky/70 hover:text-mist"
              >
                📅 {upcomingTournament.name} starts{" "}
                {upcomingTournament.startDate}
              </Link>
            )}
            {unclaimed.length === 0 &&
              !activeTournament &&
              !upcomingTournament && (
                <p className="font-body text-sm text-sky/50">All clear.</p>
              )}
          </div>
        </div>
      </div>

      {/* Squad Progress — the actual answer to "what progress does each player have" */}
      <div className="mt-6 rounded-lg border border-sky/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <p className="font-body text-xs uppercase tracking-wide text-sky">
            Squad Progress
          </p>
          <Link
            href="/admin/leaderboard"
            className="font-body text-xs text-ocean hover:underline"
          >
            Full stats →
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="text-left text-sky/60">
                <th className="pb-2 font-medium">Player</th>
                <th className="pb-2 text-center font-medium">Level</th>
                <th className="pb-2 text-center font-medium">XP</th>
                <th className="pb-2 text-center font-medium">Badges</th>
                <th className="pb-2 text-center font-medium">Puzzles ✓</th>
                <th className="pb-2 text-center font-medium">Challenges</th>
                <th className="pb-2 text-center font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {byXp.map((row) => {
                const player = players.find((p) => p._id === row.playerId);
                const days = daysSinceActive(player?.lastActiveDate);
                return (
                  <tr key={row.playerId} className="border-t border-sky/5">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <PlayerAvatar
                          name={row.name}
                          surname={row.surname}
                          avatarUrl={row.avatarUrl}
                          size={26}
                        />
                        <span className="text-mist">
                          {row.name} {row.surname}
                        </span>
                      </div>
                    </td>
                    <td className="text-center font-mono text-[#E0A72F]">
                      {row.level}
                    </td>
                    <td className="text-center font-mono text-mist">
                      {row.pts}
                    </td>
                    <td className="text-center font-mono text-mist">
                      {row.badgesEarned}
                    </td>
                    <td className="text-center font-mono text-mist">
                      {row.puzzlesCorrect}
                    </td>
                    <td className="text-center font-mono text-mist">
                      {row.challengesCompleted}
                    </td>
                    <td className="text-center font-body text-xs text-sky/60">
                      {days === null
                        ? "Never"
                        : days === 0
                          ? "Today"
                          : `${days}d ago`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {NAV_SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-sky/10 bg-white/[0.02] p-3 text-center font-body text-sm text-mist transition hover:border-ocean/50 hover:bg-white/[0.05]"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
