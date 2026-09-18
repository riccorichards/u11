"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const RESULT_OPTIONS = [
  { value: "CHAMPION", label: "Champion" },
  { value: "RUNNER_UP", label: "Runner-up" },
  { value: "SEMIFINAL", label: "Semifinal" },
  { value: "GROUP_STAGE", label: "Group Stage" },
  { value: "PARTICIPATED", label: "Participated" },
];

const RESULT_COLOR: Record<string, string> = {
  W: "#1FA97A",
  D: "#E0A72F",
  L: "#E8735C",
};

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [awarding, setAwarding] = useState(false);
  const [awardResult, setAwardResult] = useState<string | null>(null);

  async function load() {
    const [tRes, mRes, pRes, bRes] = await Promise.all([
      fetch("/api/tournaments").then((r) => r.json()),
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/badges").then((r) => r.json()),
    ]);
    setTournament(tRes.find((t: any) => t._id === id));
    setMatches(mRes.filter((m: any) => m.tournamentId === id));
    setPlayers(pRes);
    setBadges(bRes);
  }
  useEffect(() => {
    load();
  }, [id]);

  async function handleSetResult(result: string) {
    await fetch(`/api/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });
    setTournament({ ...tournament, result });
  }

  async function handleAward() {
    if (!selectedBadgeId) return;
    setAwarding(true);
    const res = await fetch(`/api/tournaments/${id}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId: selectedBadgeId }),
    });
    const data = await res.json();
    setAwarding(false);
    setAwardResult(
      res.ok
        ? `Awarded to ${data.awardedCount} players (${data.xpPerPlayer} XP each). ${data.skippedCount} already had it.`
        : data.error,
    );
  }

  if (!tournament)
    return <p className="p-6 font-body text-sm text-sky/60">Loading…</p>;

  // ── Summary stats, computed from this tournament's matches ──────
  const wins = matches.filter((m) => m.result === "W").length;
  const draws = matches.filter((m) => m.result === "D").length;
  const losses = matches.filter((m) => m.result === "L").length;
  const goalsFor = matches.reduce((sum, m) => sum + m.goalsFor, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.goalsAgainst, 0);

  const allRatings = matches.flatMap((m) =>
    (m.playerPerformances ?? []).map((p: any) => p.officialRating ?? p.rating),
  );
  const avgRating = allRatings.length
    ? (
        allRatings.reduce((a: number, b: number) => a + b, 0) /
        allRatings.length
      ).toFixed(2)
    : "—";

  const playerName = (playerId: string) => {
    const p = players.find((pl) => pl._id === playerId);
    return p ? `${p.name} ${p.surname}` : "Unknown";
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/admin/tournaments"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Tournaments
      </Link>

      <h1 className="font-display text-3xl font-extrabold text-mist">
        {tournament.name}
      </h1>
      <p className="mt-1 font-body text-sm text-sky/60">
        {tournament.startDate}
        {tournament.endDate && ` – ${tournament.endDate}`} · Difficulty{" "}
        {tournament.difficultyScore}/10
      </p>

      {/* Summary */}
      <section className="mt-8 grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-3 text-center">
          <p className="font-display text-2xl font-bold text-mist">
            {wins}-{draws}-{losses}
          </p>
          <p className="font-body text-xs text-sky/60">W-D-L</p>
        </div>
        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-3 text-center">
          <p className="font-display text-2xl font-bold text-mist">
            {goalsFor}:{goalsAgainst}
          </p>
          <p className="font-body text-xs text-sky/60">Goals</p>
        </div>
        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-3 text-center">
          <p className="font-display text-2xl font-bold text-mist">
            {avgRating}
          </p>
          <p className="font-body text-xs text-sky/60">Avg Rating</p>
        </div>
        <div className="rounded-lg border border-sky/10 bg-white/[0.02] p-3 text-center">
          <p className="font-display text-2xl font-bold text-mist">
            {matches.length}
          </p>
          <p className="font-body text-xs text-sky/60">Matches</p>
        </div>
      </section>

      {/* Match list */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-mist">Matches</h2>
        <div className="mt-3 space-y-2">
          {matches.map((m) => (
            <div
              key={m._id}
              className="flex items-center justify-between rounded-lg border border-sky/10 bg-white/[0.02] p-3"
            >
              <p className="font-body text-sm text-mist">vs {m.opponent}</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-mist">
                  {m.goalsFor}-{m.goalsAgainst}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 font-body text-xs font-medium text-white"
                  style={{ backgroundColor: RESULT_COLOR[m.result] }}
                >
                  {m.result}
                </span>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <p className="font-body text-sm text-sky/50">
              No matches logged for this tournament yet.
            </p>
          )}
        </div>
      </section>

      {/* Result */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-mist">Result</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {RESULT_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleSetResult(r.value)}
              className={`rounded-md px-3 py-1.5 font-body text-sm transition ${
                tournament.result === r.value
                  ? "bg-ocean text-white"
                  : "border border-sky/20 text-sky/70"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* Award team */}
      {tournament.result && (
        <section className="mt-8 rounded-lg border border-sky/10 bg-white/[0.02] p-4">
          <h2 className="font-display text-sm font-bold text-mist">
            Award the Team
          </h2>
          <p className="mt-1 font-body text-xs text-sky/60">
            Awards this badge to every player who appeared in a match at this
            tournament, with a bonus of{" "}
            {Math.round(tournament.difficultyScore * 15)} XP added for
            difficulty.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <select
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
              className="flex-1 rounded-md border border-sky/20 bg-transparent p-2 font-body text-sm text-mist"
            >
              <option value="" className="bg-navy-950">
                Select badge…
              </option>
              {badges.map((b) => (
                <option key={b._id} value={b._id} className="bg-navy-950">
                  {b.title} ({b.xpReward} base XP)
                </option>
              ))}
            </select>
            <button
              onClick={handleAward}
              disabled={awarding || !selectedBadgeId}
              className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white disabled:opacity-60"
            >
              {awarding ? "Awarding…" : "Award to all"}
            </button>
          </div>
          {awardResult && (
            <p className="mt-2 font-body text-sm text-[#1FA97A]">
              {awardResult}
            </p>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-mist">
          Current Stage
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "UPCOMING",
            "GROUP_STAGE",
            "ROUND_16",
            "QUARTERFINAL",
            "SEMIFINAL",
            "FINAL",
            "COMPLETED",
          ].map((s) => (
            <button
              key={s}
              onClick={async () => {
                await fetch(`/api/tournaments/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentStage: s }),
                });
                setTournament({ ...tournament, currentStage: s });
              }}
              className={`rounded-md px-3 py-1.5 font-body text-sm transition ${
                tournament.currentStage === s
                  ? "bg-ocean text-white"
                  : "border border-sky/20 text-sky/70"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
