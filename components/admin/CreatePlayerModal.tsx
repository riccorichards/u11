"use client";
import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

export default function CreatePlayerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    number: "",
    position: "MID" as (typeof POSITIONS)[number],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let avatarUrl: string | null = null;

    if (photoFile) {
      const uploadForm = new FormData();
      uploadForm.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });
      if (!uploadRes.ok) {
        setSaving(false);
        setError("Photo upload failed");
        return;
      }
      avatarUrl = (await uploadRes.json()).url;
    }

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, number: Number(form.number), avatarUrl }),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Failed to create player");
      return;
    }

    const player = await res.json();
    setCreatedCode(player.inviteCode);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-xl border border-sky/10 bg-[#041B3A] p-6 shadow-2xl">
        {createdCode ? (
          <div className="text-center">
            <PlayerAvatar
              name={form.name}
              surname={form.surname}
              avatarUrl={photoPreview}
              size={56}
            />
            <h2 className="mt-4 font-display text-2xl font-bold text-mist">
              Player added
            </h2>
            <p className="mt-1 font-body text-sm text-sky/70">
              Send this code to the parent — they'll enter it to sign in.
            </p>
            <div className="mt-4 rounded-lg bg-white/5 py-4 font-mono text-2xl font-bold tracking-[0.3em] text-mist">
              {createdCode}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdCode);
                  setCopied(true);
                }}
                className="rounded-md border border-sky/20 px-4 py-2 font-body text-sm text-mist transition hover:border-ocean"
              >
                {copied ? "Copied" : "Copy code"}
              </button>
              <button
                onClick={onClose}
                className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <PlayerAvatar
                  name={form.name}
                  surname={form.surname}
                  avatarUrl={photoPreview}
                  size={52}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              <div>
                <h2 className="font-display text-2xl font-bold text-mist">
                  Add Player
                </h2>
                <p className="font-body text-xs text-sky/60">
                  Tap the avatar to add a photo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs text-sky">First name</label>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
                />
              </div>
              <div>
                <label className="font-body text-xs text-sky">Surname</label>
                <input
                  required
                  value={form.surname}
                  onChange={(e) =>
                    setForm({ ...form, surname: e.target.value })
                  }
                  className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-xs text-sky">
                Jersey number
              </label>
              <input
                required
                type="number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
              />
            </div>

            <div>
              <label className="font-body text-xs text-sky">Position</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    type="button"
                    key={pos}
                    onClick={() => setForm({ ...form, position: pos })}
                    className={`rounded-md border py-2 font-body text-sm transition ${
                      form.position === pos
                        ? "border-ocean bg-ocean/20 text-mist"
                        : "border-sky/15 text-sky/60 hover:border-sky/40"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="font-body text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 font-body text-sm text-sky/70 hover:text-mist"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
