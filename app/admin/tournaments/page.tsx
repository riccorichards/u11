"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const res = await fetch("/api/tournaments");
    setTournaments(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    load();
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
        <h1 className="font-display text-3xl font-extrabold text-mist">
          Tournaments
        </h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white"
        >
          + New Tournament
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {tournaments.map((t) => (
          <div
            key={t._id}
            className="flex items-center justify-between rounded-lg border border-sky/10 bg-white/[0.02] p-4"
          >
            <Link href={`/admin/tournaments/${t._id}`} className="flex-1">
              <p className="font-body text-sm font-medium text-mist hover:text-ocean">
                {t.name}
              </p>
              <p className="font-body text-xs text-sky/60">
                {t.startDate}
                {t.endDate && ` – ${t.endDate}`}
                {t.result && ` · ${t.result.replace("_", " ")}`}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <span className="font-body text-xs text-sky">
                Difficulty{" "}
                <span className="font-mono text-mist">
                  {t.difficultyScore}/10
                </span>
              </span>
              <button
                onClick={() => {
                  setEditing(t);
                  setShowForm(true);
                }}
                className="font-body text-xs text-sky/70 hover:text-mist"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(t._id)}
                className="font-body text-xs text-red-400/80 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {tournaments.length === 0 && (
          <p className="font-body text-sm text-sky/50">No tournaments yet.</p>
        )}
      </div>

      {showForm && (
        <TournamentForm
          tournament={editing}
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

function TournamentForm({
  tournament,
  onClose,
  onSaved,
}: {
  tournament: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tournament?.name ?? "");
  const [difficultyScore, setDifficultyScore] = useState(
    tournament?.difficultyScore ?? 5,
  );
  const [startDate, setStartDate] = useState(
    tournament?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(tournament?.endDate ?? "");
  const [notes, setNotes] = useState(tournament?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = {
      name,
      difficultyScore,
      startDate,
      endDate: endDate || null,
      notes,
    };
    if (tournament) {
      await fetch(`/api/tournaments/${tournament._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-xl border border-sky/10 bg-[#041B3A] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-mist">
          {tournament ? "Edit Tournament" : "New Tournament"}
        </h2>

        <div>
          <label className="font-body text-xs text-sky">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Batumi Spring Cup 2027"
            className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="font-body text-xs text-sky">Difficulty</label>
            <span className="font-mono text-xs text-mist">
              {difficultyScore}/10
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={difficultyScore}
            onChange={(e) => setDifficultyScore(Number(e.target.value))}
            className="mt-1 w-full accent-[#018ABE]"
          />
          <p className="mt-1 font-body text-xs text-sky/50">
            How strong is the overall competition? A tough regional cup should
            score higher than a casual local friendly tournament.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">
              End date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
        </div>

        <div>
          <label className="font-body text-xs text-sky">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Location, format, anything worth remembering"
            className="mt-1 w-full rounded-md border border-sky/15 bg-transparent p-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
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
            disabled={saving || !name}
            className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
