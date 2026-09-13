"use client";
import { useEffect, useState } from "react";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";
import CreatePlayerModal from "@/components/admin/CreatePlayerModal";

type PlayerRow = {
  _id: string;
  name: string;
  surname: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  avatarUrl: string | null;
  inviteCode: string;
  inviteCodeClaimed: boolean;
  parentEmail?: string | null;
};

const POSITION_COLOR: Record<string, string> = {
  GK: "#E0A72F",
  DEF: "#018ABE",
  MID: "#1FA97A",
  FWD: "#E8735C",
};

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchPlayers() {
    setLoading(true);
    const res = await fetch("/api/players");
    setPlayers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-mist">
            Roster
          </h1>
          <p className="mt-1 font-body text-sm text-sky">
            Dinamo Batumi U11 squad
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white transition hover:bg-[#0299d1]"
        >
          + Add Player
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-sky/60">Loading…</p>
      ) : players.length === 0 ? (
        <div className="rounded-lg border border-sky/10 bg-white/[0.02] py-16 text-center">
          <p className="font-body text-sm text-sky/70">
            No players yet. Add your first player to generate their invite code.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-sky/10">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-sky/10 text-left text-sky/70">
                <th className="py-3 pl-4 font-medium">Player</th>
                <th className="font-medium">Position</th>
                <th className="font-medium">Invite Code</th>
                <th className="pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-sky/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        name={p.name}
                        surname={p.surname}
                        avatarUrl={p.avatarUrl}
                        size={36}
                      />
                      <div>
                        <p className="font-medium text-mist">
                          {p.name} {p.surname}
                        </p>
                        <p className="text-xs text-sky/60">#{p.number}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: POSITION_COLOR[p.position] }}
                    >
                      {p.position}
                    </span>
                  </td>
                  <td className="font-mono tracking-widest text-mist">
                    {p.inviteCode}
                  </td>
                  <td className="pr-4">
                    {p.inviteCodeClaimed ? (
                      <span className="text-[#1FA97A]">
                        Linked{p.parentEmail ? ` · ${p.parentEmail}` : ""}
                      </span>
                    ) : (
                      <span className="text-[#E0A72F]">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreatePlayerModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchPlayers}
        />
      )}
    </div>
  );
}
