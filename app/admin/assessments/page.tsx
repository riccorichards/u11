"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";
import { RatingSlider } from "@/components/admin/RatingSlider";

const PILLARS = [
  { key: "physical", label: "Physical" },
  { key: "technical", label: "Technical" },
  { key: "tactical", label: "Tactical" },
  { key: "mental", label: "Mental" },
] as const;

function currentMonthValue(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export default function AssessmentsPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data);
        const initial: Record<string, Record<string, number>> = {};
        for (const p of data) {
          initial[p._id] = {
            physical: 7,
            technical: 7,
            tactical: 7,
            mental: 7,
          };
        }
        setScores(initial);
      });
  }, []);

  function updateScore(playerId: string, pillar: string, value: number) {
    setScores({
      ...scores,
      [playerId]: { ...scores[playerId], [pillar]: value },
    });
  }

  async function handlePublish() {
    setSaving(true);
    const weekOf = `${monthValue}-01`;
    await Promise.all(
      players.map((p) =>
        fetch("/api/attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: p._id, weekOf, ...scores[p._id] }),
        }),
      ),
    );
    setSaving(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-mist">
            Monthly Assessment
          </h1>
          <p className="mt-1 font-body text-sm text-sky/60">
            Physical, technical, tactical, mental — one rating per player, per
            month
          </p>
        </div>
        <input
          type="month"
          value={monthValue}
          onChange={(e) => setMonthValue(e.target.value)}
          className="border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
        />
      </div>

      <div className="mt-6 space-y-2">
        {players.map((p) => {
          const isOpen = expanded === p._id;
          const s = scores[p._id] ?? {
            physical: 7,
            technical: 7,
            tactical: 7,
            mental: 7,
          };
          return (
            <div
              key={p._id}
              className="rounded-lg border border-sky/10 bg-white/[0.02]"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : p._id)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left"
              >
                <PlayerAvatar
                  name={p.name}
                  surname={p.surname}
                  avatarUrl={p.avatarUrl}
                  size={32}
                />
                <span className="font-body text-sm text-mist">
                  {p.name} {p.surname}
                </span>
                <span className="ml-auto font-mono text-xs text-sky/60">
                  {PILLARS.map((pl) => s[pl.key]).join(" / ")}
                </span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 gap-4 border-t border-sky/10 p-4">
                  {PILLARS.map((pl) => (
                    <RatingSlider
                      key={pl.key}
                      label={pl.label}
                      value={s[pl.key]}
                      onChange={(v) => updateScore(p._id, pl.key, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={handlePublish}
          disabled={saving || players.length === 0}
          className="rounded-md bg-ocean px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish Assessments"}
        </button>
        {done && (
          <span className="font-body text-sm text-[#1FA97A]">
            Saved for {monthValue}
          </span>
        )}
      </div>
    </div>
  );
}
