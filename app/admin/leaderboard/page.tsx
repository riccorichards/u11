"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";

type Row = {
  playerId: string;
  name: string;
  surname: string;
  number: number;
  position: string;
  avatarUrl: string | null;
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvpCount: number;
  rtg: number;
  constScore: number;
  winPct: number;
  goalsPer40: number;
  assistsPer40: number;
  trainingScore: number;
  mentalScore: number;
  disciplineScore: number;
};

const COLUMNS: { key: keyof Row; label: string; suffix?: string }[] = [
  { key: "matchesPlayed", label: "MP" },
  { key: "goals", label: "G" },
  { key: "assists", label: "A" },
  { key: "mvpCount", label: "MVP" },
  { key: "rtg", label: "RTG" },
  { key: "constScore", label: "CONST" },
  { key: "winPct", label: "WIN%", suffix: "%" },
  { key: "goalsPer40", label: "G/40" },
  { key: "assistsPer40", label: "A/40" },
  { key: "trainingScore", label: "TRAIN" },
  { key: "mentalScore", label: "MENTAL" },
  { key: "disciplineScore", label: "DISC" },
];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sortKey, setSortKey] = useState<keyof Row>("rtg");
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  }, []);

  function handleSort(key: keyof Row) {
    if (key === sortKey) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDesc ? bv - av : av - bv;
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Dashboard
      </Link>
      <h1 className="font-display text-3xl font-extrabold text-mist">
        Leaderboard
      </h1>
      <p className="mt-1 font-body text-xs text-sky/60">
        Coach-only view. Includes discipline and mental scores — never shown to
        players or parents.
      </p>

      {loading ? (
        <p className="mt-6 font-body text-sm text-sky/60">Computing…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-sky/10">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-sky/10 text-left text-sky/70">
                <th className="sticky left-0 bg-[#031229] py-2 pl-4 pr-3 font-medium">
                  Player
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    className="cursor-pointer whitespace-nowrap px-2 py-2 text-center font-medium hover:text-mist"
                  >
                    {c.label}
                    {sortKey === c.key && (sortDesc ? " ↓" : " ↑")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.playerId}
                  className="border-b border-sky/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="sticky left-0 bg-[#031229] py-2 pl-4 pr-3">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar
                        name={r.name}
                        surname={r.surname}
                        avatarUrl={r.avatarUrl}
                        size={28}
                      />
                      <span className="whitespace-nowrap text-mist">
                        {r.name} {r.surname}{" "}
                        <span className="text-sky/50">#{r.number}</span>
                      </span>
                    </div>
                  </td>
                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className="px-2 py-2 text-center font-mono text-mist"
                    >
                      {r[c.key]}
                      {c.suffix}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
