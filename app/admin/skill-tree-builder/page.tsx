"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SkillTreePreview } from "@/components/admin/SkillTreePreview";

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
const STATUSES = ["LOCKED", "IN_PROGRESS", "MASTERED"] as const;

export default function SkillTreeBuilderPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [branch, setBranch] = useState<{
    isGlobal: boolean;
    position: string | null;
  }>({
    isGlobal: true,
    position: null,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tierLevel: 1,
    parentId: "",
    requirements: "",
  });
  const [saving, setSaving] = useState(false);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});

  async function loadNodes() {
    const res = await fetch("/api/skill-tree");
    setNodes(await res.json());
  }

  useEffect(() => {
    loadNodes();
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers);
    fetch("/api/puzzles")
      .then((r) => r.json())
      .then(setPuzzles);
  }, []);

  useEffect(() => {
    if (!selectedPlayerId) {
      setProgressMap({});
      return;
    }
    fetch(`/api/skill-tree/progress?playerId=${selectedPlayerId}`)
      .then((r) => r.json())
      .then(setProgressMap);
  }, [selectedPlayerId]);

  const branchNodes = nodes.filter((n) =>
    branch.isGlobal
      ? n.isGlobal
      : !n.isGlobal && n.positionGroup === branch.position,
  );

  const selectedNode = nodes.find((n) => n._id === selectedNodeId);

  function loadNodeIntoForm(node: any) {
    setSelectedNodeId(node._id);
    setForm({
      title: node.title,
      description: node.description ?? "",
      tierLevel: node.tierLevel ?? 1,
      parentId: node.parentId ?? "",
      requirements: node.requirements ?? "",
    });
  }

  function resetForm() {
    setSelectedNodeId(null);
    setForm({
      title: "",
      description: "",
      tierLevel: 1,
      parentId: "",
      requirements: "",
    });
  }

  async function handleSaveNode() {
    setSaving(true);
    const payload = {
      ...form,
      isGlobal: branch.isGlobal,
      positionGroup: branch.position,
      parentId: form.parentId || null,
    };

    if (selectedNodeId) {
      await fetch(`/api/skill-tree/${selectedNodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/skill-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await loadNodes();
    setSaving(false);
    resetForm();
  }

  async function handleDeleteNode() {
    if (!selectedNodeId) return;
    await fetch(`/api/skill-tree/${selectedNodeId}`, { method: "DELETE" });
    await loadNodes();
    resetForm();
  }

  async function handleSetStatus(status: string) {
    if (!selectedPlayerId || !selectedNodeId) return;
    await fetch("/api/skill-tree/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: selectedPlayerId,
        nodeId: selectedNodeId,
        status,
      }),
    });
    setProgressMap({ ...progressMap, [selectedNodeId]: status });
  }

  const relatedPuzzles = selectedNode
    ? puzzles.filter((p) => p.skillNodeId === selectedNode._id)
    : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← Dashboard
      </Link>

      <h1 className="font-display text-3xl font-extrabold text-mist">
        Skill Tree Builder
      </h1>

      {/* Branch toggle */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setBranch({ isGlobal: true, position: null });
            resetForm();
          }}
          className={`rounded-md px-3 py-1.5 font-body text-sm transition ${
            branch.isGlobal
              ? "bg-ocean text-white"
              : "border border-sky/20 text-sky/70"
          }`}
        >
          Global
        </button>
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => {
              setBranch({ isGlobal: false, position: pos });
              resetForm();
            }}
            className={`rounded-md px-3 py-1.5 font-body text-sm transition ${
              !branch.isGlobal && branch.position === pos
                ? "bg-ocean text-white"
                : "border border-sky/20 text-sky/70"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Left column: tree preview + player status + related puzzles */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-body text-xs text-sky">Tree preview</span>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="rounded-md border border-sky/20 bg-transparent px-2 py-1 font-body text-xs text-mist"
            >
              <option value="" className="bg-navy-950">
                View structure only
              </option>
              {players.map((p) => (
                <option key={p._id} value={p._id} className="bg-navy-950">
                  {p.name} {p.surname}
                </option>
              ))}
            </select>
          </div>

          <SkillTreePreview
            nodes={branchNodes}
            progressMap={progressMap}
            onSelectNode={(id) => {
              const node = branchNodes.find((n) => n._id === id);
              if (node) loadNodeIntoForm(node);
            }}
            selectedNodeId={selectedNodeId}
          />

          {selectedPlayerId && selectedNode && (
            <div className="mt-3 rounded-lg border border-sky/10 bg-white/[0.02] p-3">
              <p className="font-body text-xs text-sky">
                {selectedNode.title} — this player's status
              </p>
              <div className="mt-2 flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSetStatus(s)}
                    className={`rounded-md px-2.5 py-1 font-body text-xs transition ${
                      progressMap[selectedNodeId!] === s
                        ? "bg-ocean text-white"
                        : "border border-sky/20 text-sky/70"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedNode && (
            <div className="mt-3 rounded-lg border border-sky/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <p className="font-body text-xs text-sky">Related Puzzles</p>
                <Link
                  href={`/admin/content-manager?nodeId=${selectedNode._id}`}
                  className="font-body text-xs text-ocean hover:underline"
                >
                  + Add puzzle for this node
                </Link>
              </div>
              <div className="mt-2 space-y-1">
                {relatedPuzzles.map((p) => (
                  <div key={p._id} className="font-body text-xs text-mist">
                    {p.title}{" "}
                    <span className="text-sky/50">· {p.xpReward} XP</span>
                  </div>
                ))}
                {relatedPuzzles.length === 0 && (
                  <p className="font-body text-xs text-sky/50">
                    No puzzles linked yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: node form */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-body text-xs text-sky">
              {selectedNodeId ? "Edit node" : "New node"}
            </span>
            {selectedNodeId && (
              <button
                onClick={resetForm}
                className="font-body text-xs text-sky/60 hover:text-mist"
              >
                + New instead
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-sky/10 bg-white/[0.02] p-4">
            <div>
              <label className="font-body text-xs text-sky">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
              />
            </div>
            <div>
              <label className="font-body text-xs text-sky">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-sky/15 bg-transparent p-2 font-body text-sm text-mist outline-none focus:border-ocean"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-sky">Tier</label>
                <input
                  type="number"
                  value={form.tierLevel}
                  onChange={(e) =>
                    setForm({ ...form, tierLevel: Number(e.target.value) })
                  }
                  className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
                />
              </div>
              <div>
                <label className="font-body text-xs text-sky">
                  Parent node
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) =>
                    setForm({ ...form, parentId: e.target.value })
                  }
                  className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
                >
                  <option value="" className="bg-navy-950">
                    None (root)
                  </option>
                  {branchNodes
                    .filter((n) => n._id !== selectedNodeId)
                    .map((n) => (
                      <option key={n._id} value={n._id} className="bg-navy-950">
                        {n.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div>
              <label className="font-body text-xs text-sky">
                Unlock criteria
              </label>
              <input
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
                placeholder="What does mastering this actually require?"
                className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveNode}
                disabled={saving || !form.title}
                className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
              >
                {saving ? "Saving…" : selectedNodeId ? "Update" : "Create"}
              </button>
              {selectedNodeId && (
                <button
                  onClick={handleDeleteNode}
                  className="rounded-md border border-red-500/30 px-3 py-2 font-body text-xs text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
