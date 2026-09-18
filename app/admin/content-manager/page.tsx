"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Puzzle = {
  _id: string;
  title: string;
  question: string;
  diagramUrl: string | null;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  xpReward: number;
  isDailyQuest: boolean;
  scheduledFor: string | null;
  skillNodeId?: string | null;
};
type BadgeT = {
  _id: string;
  title: string;
  description: string;
  iconUrl: string | null;
  category: "DISCIPLINE" | "TACTICAL" | "MILESTONE";
  xpReward: number;
};

const CATEGORY_COLOR: Record<string, string> = {
  DISCIPLINE: "#E0A72F",
  TACTICAL: "#018ABE",
  MILESTONE: "#1FA97A",
};

// useSearchParams requires a Suspense boundary around it in the App Router,
// so the part that reads it is split into its own inner component.
export default function ContentManagerPage() {
  return (
    <Suspense fallback={null}>
      <ContentManagerInner />
    </Suspense>
  );
}

function ContentManagerInner() {
  const searchParams = useSearchParams();
  const presetNodeId = searchParams.get("nodeId");
  const [tab, setTab] = useState<"puzzles" | "badges">("puzzles");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Dashboard
      </Link>
      <h1 className="font-display text-3xl font-extrabold text-mist">
        Content Manager
      </h1>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab("puzzles")}
          className={`rounded-md px-4 py-1.5 font-body text-sm transition ${
            tab === "puzzles"
              ? "bg-ocean text-white"
              : "border border-sky/20 text-sky/70"
          }`}
        >
          Puzzles
        </button>
        <button
          onClick={() => setTab("badges")}
          className={`rounded-md px-4 py-1.5 font-body text-sm transition ${
            tab === "badges"
              ? "bg-ocean text-white"
              : "border border-sky/20 text-sky/70"
          }`}
        >
          Badges
        </button>
      </div>

      {tab === "puzzles" ? (
        <PuzzlesTab presetNodeId={presetNodeId} />
      ) : (
        <BadgesTab />
      )}
    </div>
  );
}

// ── Puzzles ──────────────────────────────────────────────────────
function PuzzlesTab({ presetNodeId }: { presetNodeId: string | null }) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [editing, setEditing] = useState<Puzzle | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const [pRes, nRes] = await Promise.all([
      fetch("/api/puzzles"),
      fetch("/api/skill-tree"),
    ]);
    setPuzzles(await pRes.json());
    setNodes(await nRes.json());
  }

  useEffect(() => {
    load();
    // Arrived via "+ Add puzzle for this node" from the Skill Tree Builder —
    // jump straight into a pre-linked new puzzle rather than the empty list.
    if (presetNodeId) {
      setEditing(null);
      setShowForm(true);
    }
  }, [presetNodeId]);

  const nodeTitle = (id?: string | null) =>
    nodes.find((n) => n._id === id)?.title;

  async function handleDelete(id: string) {
    await fetch(`/api/puzzles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white"
      >
        + New Puzzle
      </button>

      <div className="mt-4 space-y-2">
        {puzzles.map((p) => (
          <div
            key={p._id}
            className="rounded-lg border border-sky/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-sm font-medium text-mist">
                  {p.title}
                </p>
                <p className="mt-1 font-body text-xs text-sky/60">
                  {p.xpReward} XP ·{" "}
                  {p.isDailyQuest ? "Daily quest" : "Practice"}
                  {p.scheduledFor && ` · Scheduled ${p.scheduledFor}`}
                  {p.skillNodeId &&
                    nodeTitle(p.skillNodeId) &&
                    ` · Linked to "${nodeTitle(p.skillNodeId)}"`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(p);
                    setShowForm(true);
                  }}
                  className="font-body text-xs text-sky/70 hover:text-mist"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="font-body text-xs text-red-400/80 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {puzzles.length === 0 && (
          <p className="font-body text-sm text-sky/50">No puzzles yet.</p>
        )}
      </div>

      {showForm && (
        <PuzzleForm
          puzzle={editing}
          nodes={nodes}
          presetNodeId={presetNodeId}
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

function PuzzleForm({
  puzzle,
  nodes,
  presetNodeId,
  onClose,
  onSaved,
}: {
  puzzle: Puzzle | null;
  nodes: any[];
  presetNodeId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(puzzle?.title ?? "");
  const [question, setQuestion] = useState(puzzle?.question ?? "");
  const [options, setOptions] = useState(
    puzzle?.options ?? [
      { id: "a", text: "" },
      { id: "b", text: "" },
    ],
  );
  const [correctOptionId, setCorrectOptionId] = useState(
    puzzle?.correctOptionId ?? "a",
  );
  const [explanation, setExplanation] = useState(puzzle?.explanation ?? "");
  const [xpReward, setXpReward] = useState(puzzle?.xpReward ?? 30);
  const [isDailyQuest, setIsDailyQuest] = useState(
    puzzle?.isDailyQuest ?? false,
  );
  const [scheduledFor, setScheduledFor] = useState(puzzle?.scheduledFor ?? "");
  const [diagramUrl, setDiagramUrl] = useState(puzzle?.diagramUrl ?? null);
  const [skillNodeId, setSkillNodeId] = useState(
    puzzle?.skillNodeId ?? presetNodeId ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function addOption() {
    const nextId = String.fromCharCode(97 + options.length); // a, b, c, d...
    setOptions([...options, { id: nextId, text: "" }]);
  }
  function removeOption(id: string) {
    setOptions(options.filter((o) => o.id !== id));
  }

  async function handleDiagramUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.ok) setDiagramUrl((await res.json()).url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      title,
      question,
      options,
      correctOptionId,
      explanation,
      xpReward,
      isDailyQuest,
      scheduledFor: scheduledFor || null,
      diagramUrl,
      skillNodeId: skillNodeId || null,
    };
    if (puzzle) {
      await fetch(`/api/puzzles/${puzzle._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/puzzles", {
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
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-sky/10 bg-[#041B3A] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-mist">
          {puzzle ? "Edit Puzzle" : "New Puzzle"}
        </h2>

        <div>
          <label className="font-body text-xs text-sky">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
        </div>

        <div>
          <label className="font-body text-xs text-sky">Question</label>
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 w-full rounded-md border border-sky/15 bg-transparent p-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
        </div>

        <div>
          <label className="font-body text-xs text-sky">
            Related skill node (optional)
          </label>
          <select
            value={skillNodeId}
            onChange={(e) => setSkillNodeId(e.target.value)}
            className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
          >
            <option value="" className="bg-navy-950">
              None
            </option>
            {nodes.map((n) => (
              <option key={n._id} value={n._id} className="bg-navy-950">
                {n.isGlobal ? "[Global]" : `[${n.positionGroup}]`} {n.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body text-xs text-sky">
            Diagram (optional)
          </label>
          {diagramUrl && (
            <img src={diagramUrl} alt="" className="mt-2 max-h-32 rounded-md" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleDiagramUpload}
            className="mt-1 font-body text-xs text-sky/70"
          />
          {uploading && (
            <p className="font-body text-xs text-sky/50">Uploading…</p>
          )}
        </div>

        <div>
          <label className="font-body text-xs text-sky">Answer options</label>
          <div className="mt-2 space-y-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={correctOptionId === opt.id}
                  onChange={() => setCorrectOptionId(opt.id)}
                />
                <input
                  value={opt.text}
                  onChange={(e) =>
                    setOptions(
                      options.map((o) =>
                        o.id === opt.id ? { ...o, text: e.target.value } : o,
                      ),
                    )
                  }
                  placeholder={`Option ${opt.id.toUpperCase()}`}
                  className="flex-1 border-0 border-b border-sky/25 bg-transparent pb-1 font-body text-sm text-mist outline-none focus:border-ocean"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(opt.id)}
                    className="text-sky/40 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 4 && (
            <button
              onClick={addOption}
              className="mt-2 font-body text-xs text-sky/70 hover:text-mist"
            >
              + Add option
            </button>
          )}
          <p className="mt-1 font-body text-xs text-sky/50">
            Select the radio button next to the correct answer.
          </p>
        </div>

        <div>
          <label className="font-body text-xs text-sky">
            Explanation (shown after answering)
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="mt-1 w-full rounded-md border border-sky/15 bg-transparent p-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">XP reward</label>
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">
              Scheduled date (optional)
            </label>
            <input
              type="date"
              value={scheduledFor ?? ""}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 font-body text-xs text-sky">
          <input
            type="checkbox"
            checked={isDailyQuest}
            onChange={(e) => setIsDailyQuest(e.target.checked)}
          />
          Eligible to appear as the daily quest
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 font-body text-sm text-sky/70 hover:text-mist"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title || !question}
            className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Badges ───────────────────────────────────────────────────────
function BadgesTab() {
  const [badges, setBadges] = useState<BadgeT[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [editing, setEditing] = useState<BadgeT | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [awardingBadgeId, setAwardingBadgeId] = useState<string | null>(null);
  const [awardMessage, setAwardMessage] = useState<string | null>(null);

  async function load() {
    const [bRes, pRes] = await Promise.all([
      fetch("/api/badges"),
      fetch("/api/players"),
    ]);
    setBadges(await bRes.json());
    setPlayers(await pRes.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAward(badgeId: string, playerId: string) {
    const res = await fetch("/api/badges/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId, playerId }),
    });
    const data = await res.json();
    setAwardMessage(
      res.ok ? `Awarded! New level: ${data.newLevel}` : data.error,
    );
    setAwardingBadgeId(null);
    setTimeout(() => setAwardMessage(null), 3000);
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white"
      >
        + New Badge
      </button>

      {awardMessage && (
        <p className="mt-3 font-body text-sm text-[#1FA97A]">{awardMessage}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {badges.map((b) => (
          <div
            key={b._id}
            className="rounded-lg border border-sky/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-3">
              {b.iconUrl ? (
                <img
                  src={b.iconUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[b.category] }}
                />
              )}
              <div>
                <p className="font-body text-sm font-medium text-mist">
                  {b.title}
                </p>
                <p className="font-body text-xs text-sky/60">
                  {b.category} · {b.xpReward} XP
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setEditing(b);
                  setShowForm(true);
                }}
                className="font-body text-xs text-sky/70 hover:text-mist"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  setAwardingBadgeId(awardingBadgeId === b._id ? null : b._id)
                }
                className="font-body text-xs text-ocean hover:underline"
              >
                Award to player
              </button>
            </div>

            {awardingBadgeId === b._id && (
              <select
                onChange={(e) =>
                  e.target.value && handleAward(b._id, e.target.value)
                }
                defaultValue=""
                className="mt-2 w-full rounded-md border border-sky/20 bg-transparent p-1.5 font-body text-xs text-mist"
              >
                <option value="" disabled className="bg-navy-950">
                  Select player…
                </option>
                {players.map((p) => (
                  <option key={p._id} value={p._id} className="bg-navy-950">
                    {p.name} {p.surname}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <BadgeForm
          badge={editing}
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

function BadgeForm({
  badge,
  onClose,
  onSaved,
}: {
  badge: BadgeT | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(badge?.title ?? "");
  const [description, setDescription] = useState(badge?.description ?? "");
  const [category, setCategory] = useState(badge?.category ?? "MILESTONE");
  const [xpReward, setXpReward] = useState(badge?.xpReward ?? 50);
  const [iconUrl, setIconUrl] = useState(badge?.iconUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.ok) setIconUrl((await res.json()).url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { title, description, category, xpReward, iconUrl };
    if (badge) {
      await fetch(`/api/badges/${badge._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/badges", {
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
          {badge ? "Edit Badge" : "New Badge"}
        </h2>

        <div className="flex items-center gap-3">
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleIconUpload}
            className="font-body text-xs text-sky/70"
          />
        </div>
        {uploading && (
          <p className="font-body text-xs text-sky/50">Uploading…</p>
        )}

        <div>
          <label className="font-body text-xs text-sky">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
        </div>

        <div>
          <label className="font-body text-xs text-sky">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-sky/15 bg-transparent p-2 font-body text-sm text-mist outline-none focus:border-ocean"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            >
              <option value="DISCIPLINE" className="bg-navy-950">
                Discipline
              </option>
              <option value="TACTICAL" className="bg-navy-950">
                Tactical
              </option>
              <option value="MILESTONE" className="bg-navy-950">
                Milestone
              </option>
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-sky">XP reward</label>
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
            />
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
            disabled={saving || !title}
            className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
