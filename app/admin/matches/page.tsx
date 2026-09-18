"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MatchPlayerRow,
  type MatchPerformance,
} from "@/components/admin/MatchPlayerRow";

const DEFAULT_PERF: MatchPerformance = {
  minutesPlayed: 60,
  goals: 0,
  assists: 0,
  rating: 7,
  isMvp: false,
  yellowCard: false,
  redCard: false,
  defensiveContrib: 7,
  technicalExec: 7,
  tacticalDiscipline: 7,
  attackingContrib: 7,
  mentalPerformance: 7,
};

const RESULT_COLOR: Record<string, string> = {
  W: "#1FA97A",
  D: "#E0A72F",
  L: "#E8735C",
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/matches");
    setMatches((await res.json()).reverse());
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-mist">
          Matches
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white"
        >
          + Log Match
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {matches.map((m) => (
          <div
            key={m._id}
            className="flex items-center justify-between rounded-lg border border-sky/10 bg-white/[0.02] p-4"
          >
            <div>
              <p className="font-body text-sm font-medium text-mist">
                vs {m.opponent}
              </p>
              <p className="font-body text-xs text-sky/60">
                {m.date} · {m.homeAway} · {m.matchType}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg text-mist">
                {m.goalsFor} - {m.goalsAgainst}
              </span>
              <span
                className="rounded-full px-2.5 py-1 font-body text-xs font-medium text-white"
                style={{ backgroundColor: RESULT_COLOR[m.result] }}
              >
                {m.result}
              </span>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="font-body text-sm text-sky/50">
            No matches logged yet.
          </p>
        )}
      </div>

      {showForm && (
        <MatchForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function MatchForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [players, setPlayers] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [useTrackedOpponent, setUseTrackedOpponent] = useState(false);
  const [opponentId, setOpponentId] = useState("");
  const [opponentName, setOpponentName] = useState("");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [homeAway, setHomeAway] = useState<"home" | "away">("home");
  const [goalsFor, setGoalsFor] = useState(0);
  const [goalsAgainst, setGoalsAgainst] = useState(0);
  const [matchType, setMatchType] = useState<
    "LEAGUE" | "TOURNAMENT" | "FRIENDLY"
  >("FRIENDLY");
  const [tournamentId, setTournamentId] = useState("");

  const [played, setPlayed] = useState<Record<string, boolean>>({});
  const [perfs, setPerfs] = useState<Record<string, MatchPerformance>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data);
        const p: Record<string, boolean> = {};
        const f: Record<string, MatchPerformance> = {};
        for (const player of data) {
          p[player._id] = false;
          f[player._id] = { ...DEFAULT_PERF };
        }
        setPlayed(p);
        setPerfs(f);
      });
    fetch("/api/opponents")
      .then((r) => r.json())
      .then(setOpponents);
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then(setTournaments);
  }, []);

  async function handleSave() {
    setSaving(true);
    const resolvedName = useTrackedOpponent
      ? (opponents.find((o) => o._id === opponentId)?.name ?? opponentName)
      : opponentName;

    const playerPerformances = players
      .filter((p) => played[p._id])
      .map((p) => ({ playerId: p._id, ...perfs[p._id] }));

    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        opponent: resolvedName,
        homeAway,
        goalsFor,
        goalsAgainst,
        matchType,
        tournamentId: matchType === "TOURNAMENT" ? tournamentId || null : null,
        opponentId: useTrackedOpponent ? opponentId || null : null,
        playerPerformances,
      }),
    });

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-6 py-8">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-sky/10 bg-[#041B3A] p-6 space-y-5">
        <h2 className="font-display text-xl font-bold text-mist">Log Match</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">Home / Away</label>
            <select
              value={homeAway}
              onChange={(e) => setHomeAway(e.target.value as any)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            >
              <option value="home" className="bg-navy-950">
                Home
              </option>
              <option value="away" className="bg-navy-950">
                Away
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-body text-xs text-sky">Match Type</label>
          <div className="mt-1 flex gap-2">
            {(["FRIENDLY", "LEAGUE", "TOURNAMENT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMatchType(t)}
                className={`rounded-md px-3 py-1.5 font-body text-xs transition ${
                  matchType === t
                    ? "bg-ocean text-white"
                    : "border border-sky/20 text-sky/70"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {matchType === "TOURNAMENT" && (
          <div>
            <label className="font-body text-xs text-sky">Tournament</label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            >
              <option value="" className="bg-navy-950">
                Select tournament…
              </option>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id} className="bg-navy-950">
                  {t.name} (difficulty {t.difficultyScore}/10)
                </option>
              ))}
            </select>
            <Link
              href="/admin/tournaments"
              className="mt-1 inline-block font-body text-xs text-ocean hover:underline"
            >
              + Manage tournaments
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <label className="font-body text-xs text-sky">Opponent</label>
            <button
              onClick={() => setUseTrackedOpponent(!useTrackedOpponent)}
              className="font-body text-xs text-ocean hover:underline"
            >
              {useTrackedOpponent
                ? "Type name instead"
                : "Pick tracked opponent"}
            </button>
          </div>
          {useTrackedOpponent ? (
            <select
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            >
              <option value="" className="bg-navy-950">
                Select opponent…
              </option>
              {opponents.map((o) => (
                <option key={o._id} value={o._id} className="bg-navy-950">
                  {o.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="Opponent name"
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">Goals For</label>
            <input
              type="number"
              value={goalsFor}
              onChange={(e) => setGoalsFor(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">Goals Against</label>
            <input
              type="number"
              value={goalsAgainst}
              onChange={(e) => setGoalsAgainst(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
        </div>

        <div>
          <h3 className="font-body text-sm font-medium text-mist">
            Player Performances
          </h3>
          <div className="mt-2 space-y-2">
            {players.map((p) => (
              <MatchPlayerRow
                key={p._id}
                player={p}
                played={played[p._id]}
                onTogglePlayed={() =>
                  setPlayed({ ...played, [p._id]: !played[p._id] })
                }
                perf={perfs[p._id] ?? DEFAULT_PERF}
                onPerfChange={(perf) => setPerfs({ ...perfs, [p._id]: perf })}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 font-body text-sm text-sky/70 hover:text-mist"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!opponentName && !opponentId)}
            className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Publish Match"}
          </button>
        </div>
      </div>
    </div>
  );
}
