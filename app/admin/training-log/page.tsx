"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlayerGradeRow,
  type PlayerGrade,
} from "@/components/admin/PlayerGradeRow";
import Link from "next/link";

const SESSION_TYPES = [
  "tactical",
  "physical",
  "technical",
  "mixed",
  "recovery",
  "pre_match",
] as const;
const LINKED_METRICS = [
  { key: "", label: "General (no specific metric)" },
  { key: "workRate", label: "Work Rate" },
  { key: "technicalQuality", label: "Technical Quality" },
  { key: "tacticalAwareness", label: "Tactical Awareness" },
  { key: "focusLevel", label: "Focus" },
  { key: "bodyLanguage", label: "Body Language" },
  { key: "coachability", label: "Coachability" },
];

const DEFAULT_GRADE: PlayerGrade = {
  workRate: 7,
  technicalQuality: 7,
  tacticalAwareness: 7,
  focusLevel: 7,
  bodyLanguage: 7,
  coachability: 7,
  emotionalState: "neutral",
  fatigueLevel: 5,
  injuryFlag: false,
  minutesParticipated: 90,
};

export default function TrainingLogPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, PlayerGrade>>({});

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionType, setSessionType] =
    useState<(typeof SESSION_TYPES)[number]>("mixed");
  const [intensity, setIntensity] = useState(6);
  const [quality, setQuality] = useState(7);
  const [fatigue, setFatigue] = useState(5);
  const [coachRating, setCoachRating] = useState(7);
  const [teamwork, setTeamwork] = useState(7);
  const [notes, setNotes] = useState("");
  const [accents, setAccents] = useState([{ text: "", linkedMetric: "" }]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        const p: Record<string, boolean> = {};
        const g: Record<string, PlayerGrade> = {};
        for (const player of data) {
          p[player._id] = true;
          g[player._id] = { ...DEFAULT_GRADE };
        }
        setPresent(p);
        setGrades(g);
      });
  }, []);

  const presentCount = Object.values(present).filter(Boolean).length;
  const attendancePct = players.length
    ? Math.round((presentCount / players.length) * 100)
    : 0;

  function addAccent() {
    if (accents.length < 3)
      setAccents([...accents, { text: "", linkedMetric: "" }]);
  }
  function removeAccent(i: number) {
    setAccents(accents.filter((_, idx) => idx !== i));
  }

  async function handlePublish() {
    setSaving(true);

    const playerLogs = players
      .filter((p) => present[p._id])
      .map((p) => ({ playerId: p._id, ...grades[p._id] }));

    const res = await fetch("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        sessionType,
        intensity,
        quality,
        fatigue,
        coachRating,
        teamwork, // ← added
        notes,
        attendancePct,
        keyAccents: accents.filter((a) => a.text.trim() !== ""),
        playerLogs,
      }),
    });

    setSaving(false);
    if (res.ok) setSuccess(true);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold text-mist">
          Session logged
        </h1>
        <p className="mt-2 font-body text-sm text-sky/70">
          Scores saved, team pulse recalculated.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-sky/20 px-4 py-2 font-body text-sm text-mist"
          >
            Log another session
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Dashboard
      </Link>
      <h1 className="font-display text-3xl font-extrabold text-mist">
        Log Training Session
      </h1>

      {/* Session setup */}
      <section className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as any)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t} className="bg-navy-950">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Intensity", val: intensity, set: setIntensity },
            { label: "Quality", val: quality, set: setQuality },
            { label: "Team Fatigue", val: fatigue, set: setFatigue },
            { label: "Coach Rating", val: coachRating, set: setCoachRating },
            { label: "Teamwork", val: teamwork, set: setTeamwork },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between">
                <label className="font-body text-xs text-sky">{s.label}</label>
                <span className="font-mono text-xs text-mist">{s.val}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={s.val}
                onChange={(e) => s.set(Number(e.target.value))}
                className="mt-1 w-full accent-[#018ABE]"
              />
            </div>
          ))}
        </div>

        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General session notes (optional)"
          className="w-full rounded-md border border-sky/15 bg-white/[0.02] p-3 font-body text-sm text-mist outline-none focus:border-ocean"
        />
      </section>

      {/* Today's focus */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">
          Today's Focus
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          What this session was really about — link it to a metric to track it
          over time.
        </p>
        <div className="mt-3 space-y-2">
          {accents.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={a.text}
                onChange={(e) => {
                  const next = [...accents];
                  next[i].text = e.target.value;
                  setAccents(next);
                }}
                placeholder="e.g. Scanning before receiving the ball"
                className="flex-1 border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
              />
              <select
                value={a.linkedMetric}
                onChange={(e) => {
                  const next = [...accents];
                  next[i].linkedMetric = e.target.value;
                  setAccents(next);
                }}
                className="w-48 rounded-md border border-sky/20 bg-transparent px-2 font-body text-xs text-mist"
              >
                {LINKED_METRICS.map((m) => (
                  <option key={m.key} value={m.key} className="bg-navy-950">
                    {m.label}
                  </option>
                ))}
              </select>
              {accents.length > 1 && (
                <button
                  onClick={() => removeAccent(i)}
                  className="text-sky/50 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {accents.length < 3 && (
          <button
            onClick={addAccent}
            className="mt-2 font-body text-xs text-sky/70 hover:text-mist"
          >
            + Add focus point
          </button>
        )}
      </section>

      {/* Attendance & grading */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-mist">
            Attendance & Grading
          </h2>
          <span className="font-body text-sm text-sky">
            {presentCount}/{players.length} present ({attendancePct}%)
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {players.map((p) => (
            <PlayerGradeRow
              key={p._id}
              player={p}
              present={present[p._id]}
              onTogglePresent={() =>
                setPresent({ ...present, [p._id]: !present[p._id] })
              }
              grade={grades[p._id] ?? DEFAULT_GRADE}
              onGradeChange={(g) => setGrades({ ...grades, [p._id]: g })}
            />
          ))}
        </div>
      </section>

      <div className="mt-10">
        <button
          onClick={handlePublish}
          disabled={saving || players.length === 0}
          className="rounded-md bg-ocean px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish Session"}
        </button>
      </div>
    </div>
  );
}
