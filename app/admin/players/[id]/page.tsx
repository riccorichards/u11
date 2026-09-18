"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

const TARGET_FIELDS: { key: string; label: string; suffix?: string }[] = [
  { key: "prsAvg", label: "Session Readiness (PRS avg)", suffix: "%" },
  { key: "avgRating", label: "Average Match Rating", suffix: "/10" },
  { key: "attendanceRate", label: "Attendance Rate", suffix: "%" },
  { key: "consistencyScore", label: "Consistency Score", suffix: "%" },
  { key: "disciplineScore", label: "Discipline Score", suffix: "%" },
  { key: "pillarOverall", label: "Pillar Overall", suffix: "/10" },
];

export default function PlayerProfileEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [player, setPlayer] = useState<any>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pRes, kRes] = await Promise.all([
        fetch(`/api/players/${id}`),
        fetch(`/api/kpi?playerId=${id}`),
      ]);
      const { player: playerData } = await pRes.json(); // nested under .player
      const k = await kRes.json();

      setPlayer(playerData);

      const t: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        t[field.key] =
          k.targets?.[field.key] != null ? String(k.targets[field.key]) : "";
      }
      setTargets(t);
      setLoading(false);
    }
    load();
  }, [id]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    let avatarUrl = player.avatarUrl;
    if (photoFile) {
      const form = new FormData();
      form.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (uploadRes.ok) avatarUrl = (await uploadRes.json()).url;
    }

    await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...player, avatarUrl }),
    });
    setPlayer({ ...player, avatarUrl });

    const numericTargets: Record<string, number> = {};
    for (const [key, val] of Object.entries(targets)) {
      if (val !== "") numericTargets[key] = Number(val);
    }
    await fetch(`/api/kpi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id, targets: numericTargets }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleRegenerateCode() {
    setRegenerating(true);
    const res = await fetch(`/api/players/${id}/regenerate-code`, {
      method: "POST",
    });
    if (res.ok) {
      const updated = await res.json();
      setPlayer((prev: any) => ({
        ...prev,
        inviteCode: updated.inviteCode,
        inviteCodeClaimed: false,
      }));
    }
    setRegenerating(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id }),
    });
    if (res.ok) {
      router.push("/admin/players");
    } else {
      setDeleting(false);
    }
  }

  if (loading || !player) {
    return <p className="p-6 font-body text-sm text-sky/60">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <button
        onClick={() => router.push("/admin/players")}
        className="mb-6 font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Back to Roster
      </button>

      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          <PlayerAvatar
            name={player.name}
            surname={player.surname}
            avatarUrl={photoPreview ?? player.avatarUrl}
            size={64}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </label>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-mist">
            {player.name} {player.surname}
          </h1>
          <p className="font-body text-sm text-sky/60">
            #{player.number} · {player.position}
          </p>
        </div>
      </div>

      {/* Basic info */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">Basic Info</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">First name</label>
            <input
              value={player.name}
              onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">Surname</label>
            <input
              value={player.surname}
              onChange={(e) =>
                setPlayer({ ...player, surname: e.target.value })
              }
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">Jersey number</label>
            <input
              type="number"
              value={player.number}
              onChange={(e) =>
                setPlayer({ ...player, number: Number(e.target.value) })
              }
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">Position</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPlayer({ ...player, position: pos })}
                  className={`rounded-md border py-1.5 font-body text-sm transition ${
                    player.position === pos
                      ? "border-ocean bg-ocean/20 text-mist"
                      : "border-sky/15 text-sky/60 hover:border-sky/40"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IDP Targets */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">
          Individual Development Targets
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          Leave a field blank if you're not tracking it for this player yet.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {TARGET_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="font-body text-xs text-sky">
                {field.label}
              </label>
              <div className="mt-1 flex items-center border-b border-sky/25 focus-within:border-ocean">
                <input
                  type="number"
                  step="0.1"
                  value={targets[field.key] ?? ""}
                  onChange={(e) =>
                    setTargets({ ...targets, [field.key]: e.target.value })
                  }
                  className="w-full bg-transparent pb-2 font-body text-mist outline-none"
                />
                {field.suffix && (
                  <span className="pb-2 font-body text-xs text-sky/50">
                    {field.suffix}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coach notes */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">
          Coach Notes
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          Tactical bottlenecks, development focus — visible only to coaches.
        </p>
        <textarea
          rows={4}
          value={player.developmentNotes ?? ""}
          onChange={(e) =>
            setPlayer({ ...player, developmentNotes: e.target.value })
          }
          placeholder="e.g. Struggles with scanning before receiving under blind-side pressure"
          className="mt-3 w-full rounded-md border border-sky/15 bg-white/[0.02] p-3 font-body text-sm text-mist outline-none focus:border-ocean"
        />
      </section>

      {/* Invite code */}
      <section className="mt-10 rounded-lg border border-sky/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-sky">Invite code</p>
            <p className="mt-1 font-mono text-lg tracking-widest text-mist">
              {player.inviteCode}
            </p>
            <p className="mt-1 font-body text-xs text-sky/60">
              {player.inviteCodeClaimed
                ? "Already linked to a parent account"
                : "Not yet claimed"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(player.inviteCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 1500);
              }}
              className="rounded-md border border-sky/20 px-3 py-1.5 font-body text-xs text-mist transition hover:border-ocean"
            >
              {codeCopied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="rounded-md border border-sky/20 px-3 py-1.5 font-body text-xs text-mist transition hover:border-ocean disabled:opacity-50"
            >
              {regenerating ? "…" : "Regenerate"}
            </button>
          </div>
        </div>
        {player.inviteCodeClaimed && (
          <p className="mt-2 font-body text-xs text-amber-400/80">
            Regenerating will unlink the current parent account — they'll need
            the new code to sign in again.
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section className="mt-10 rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4">
        <h2 className="font-display text-sm font-bold text-red-400">
          Danger Zone
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          Removing a player deletes their profile and permanently disconnects
          any linked parent account.
        </p>

        {confirmingDelete ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="font-body text-sm text-mist">
              Remove {player.name} {player.surname}?
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-500 px-3 py-1.5 font-body text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? "Removing…" : "Confirm removal"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="font-body text-xs text-sky/70 hover:text-mist"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 rounded-md border border-red-500/30 px-3 py-1.5 font-body text-xs text-red-400 transition hover:bg-red-500/10"
          >
            Remove Player
          </button>
        )}
      </section>

      <div className="mt-10 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-ocean px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span className="font-body text-sm text-[#1FA97A]">Saved</span>
        )}
      </div>
    </div>
  );
}
