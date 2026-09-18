"use client";
import { useEffect, useState } from "react";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";

const MEDALS = ["🥇", "🥈", "🥉"];

export function WeeklySpotlight() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/spotlight")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="mx-6 mt-6 rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        🏆 {data.category}
      </p>
      {data.top5.length === 0 ? (
        <p className="mt-3 font-body text-sm text-sky/50">
          No standout performances yet this week.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {data.top5.map((p: any, i: number) => (
            <div key={p.playerId} className="flex items-center gap-3">
              <span className="w-7 text-center font-display text-lg">
                {MEDALS[i] ?? <span className="text-sky/40">{i + 1}</span>}
              </span>
              <PlayerAvatar
                name={p.name}
                surname={p.surname}
                avatarUrl={p.avatarUrl}
                size={32}
              />
              <span className="font-body text-sm text-mist">
                {p.name} {p.surname}
              </span>
              <span className="ml-auto font-mono text-sm text-ocean">
                {p.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
