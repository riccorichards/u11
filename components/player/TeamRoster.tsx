"use client";
import { useEffect, useState } from "react";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";

export function TeamRoster() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) =>
        setPlayers(
          [...data].sort((a, b) => (b.currentXp ?? 0) - (a.currentXp ?? 0)),
        ),
      );
  }, []);

  return (
    <div className="mx-6 mt-6 rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        👥 Squad
      </p>
      <div className="mt-3 space-y-2">
        {players.map((p) => (
          <div key={p._id} className="flex items-center gap-3">
            <PlayerAvatar
              name={p.name}
              surname={p.surname}
              avatarUrl={p.avatarUrl}
              size={32}
            />
            <span className="font-body text-sm text-mist">
              {p.name} {p.surname}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span className="rounded-full bg-[#E0A72F]/20 px-2 py-0.5 font-display text-xs font-bold text-[#E0A72F]">
                Lv {p.level ?? 1}
              </span>
              <span className="font-mono text-xs text-sky/60">
                {p.currentXp ?? 0} pts
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
