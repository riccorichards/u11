// Path: app/admin/skill-tree-builder/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AudiencePicker, {
  AudienceValue,
  DEFAULT_AUDIENCE,
  toApiAudience,
} from "@/components/admin/AudiencePicker";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ModuleDialog, { ModuleRecord } from "@/components/admin/ModuleDialog";
import { useToast } from "@/components/admin/ResultToast";
import {
  errorMessage,
  openTopicMessage,
} from "@/components/admin/resultMessages";
import SkillTreePreview from "@/components/admin/SkillTreePreview";
import StatusPill from "@/components/admin/StatusPill";
import TopicForm, { RawNode } from "@/components/admin/TopicForm";
import {
  POSITIONS,
  PROGRESS_STATUS,
  TASK_TYPE_LABEL,
  button,
  card,
  cx,
  playerName,
  plural,
  ui,
} from "@/components/admin/ui";
import {
  ModuleTreeDTO,
  invalidateAdminData,
  sendJson,
  useCached,
  usePlayers,
} from "@/components/admin/useAdminData";

const UNASSIGNED = "unassigned";
type Mode =
  | { kind: "view" }
  | { kind: "create"; parentId: string | null }
  | { kind: "edit" };

export default function SkillTreeBuilderPage() {
  const { show } = useToast();
  const modules = useCached<ModuleRecord[]>("/api/modules");
  const nodes = useCached<RawNode[]>("/api/skill-tree");
  const players = usePlayers();

  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [position, setPosition] = useState<string>("ALL");
  const [previewPlayer, setPreviewPlayer] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const [moduleDialog, setModuleDialog] = useState<{
    open: boolean;
    module: ModuleRecord | null;
  }>({ open: false, module: null });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const treeUrl = useMemo(() => {
    const q = new URLSearchParams({
      includeUnpublished: "true",
      includeUnassigned: "true",
    });
    if (position !== "ALL") q.set("position", position);
    if (previewPlayer) q.set("playerId", previewPlayer);
    return `/api/skill-tree/modules?${q}`;
  }, [position, previewPlayer]);
  const trees = useCached<{ trees: ModuleTreeDTO[] }>(treeUrl);

  const moduleList = useMemo(
    () =>
      [...(modules.data ?? [])].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder,
      ),
    [modules.data],
  );
  const allNodes = nodes.data ?? [];
  const unassignedCount = allNodes.filter(
    (n) => !n.moduleId || !moduleList.some((m) => m._id === n.moduleId),
  ).length;

  useEffect(() => {
    if (activeModule) return;
    if (moduleList.length) setActiveModule(moduleList[0]._id);
    else if (unassignedCount) setActiveModule(UNASSIGNED);
  }, [moduleList, unassignedCount, activeModule]);

  const activeTree = (trees.data?.trees ?? []).find((t) =>
    activeModule === UNASSIGNED
      ? t.moduleId === null
      : t.moduleId === activeModule,
  );
  const currentModule = moduleList.find((m) => m._id === activeModule) ?? null;
  const selected = allNodes.find((n) => n._id === selectedId) ?? null;

  function refreshAll() {
    invalidateAdminData();
    modules.reload();
    nodes.reload();
    trees.reload();
  }

  function selectModule(id: string) {
    setActiveModule(id);
    setSelectedId(null);
    setMode({ kind: "view" });
  }

  async function moveModule(direction: -1 | 1) {
    if (!currentModule) return;
    const index = moduleList.findIndex((m) => m._id === currentModule._id);
    const other = moduleList[index + direction];
    if (!other) return;
    try {
      await Promise.all([
        sendJson(`/api/modules/${currentModule._id}`, "PATCH", {
          sequenceOrder: other.sequenceOrder,
        }),
        sendJson(`/api/modules/${other._id}`, "PATCH", {
          sequenceOrder: currentModule.sequenceOrder,
        }),
      ]);
      refreshAll();
    } catch (err) {
      show(errorMessage(err, "Couldn't reorder modules"));
    }
  }

  async function deleteTopic() {
    if (!selected) return;
    setBusy(true);
    try {
      await sendJson(`/api/skill-tree/${selected._id}`, "DELETE");
      show({
        tone: "success",
        title: `Deleted “${selected.title}”`,
        detail: ["Its subtopics moved up one level."],
      });
      setSelectedId(null);
      setMode({ kind: "view" });
      setConfirmDelete(false);
      refreshAll();
    } catch (err) {
      show(errorMessage(err, "Couldn't delete the topic"));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  const loading = modules.loading || nodes.loading;
  const loadError = modules.error || nodes.error;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <AdminHeader
        title="Skill Tree Builder"
        description="Build each module's topics, set who they're for, attach lessons, and open them for players."
        actions={
          <button
            type="button"
            className={button.secondary}
            onClick={() => setModuleDialog({ open: true, module: null })}
          >
            New module
          </button>
        }
      />

      {loadError && (
        <p className={cx(ui.error, "mb-4")}>
          Couldn&apos;t load the skill tree: {loadError}
        </p>
      )}

      {/* Module tabs */}
      <nav
        aria-label="Modules"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        {moduleList.map((m) => (
          <button
            key={m._id}
            type="button"
            onClick={() => selectModule(m._id)}
            aria-current={activeModule === m._id ? "page" : undefined}
            className={cx(
              ui.chip(activeModule === m._id),
              ui.focus,
              "flex items-center gap-2",
            )}
          >
            {m.title.ka}
            {!m.isPublished && (
              <span className="rounded bg-white/10 px-1.5 text-[10px] text-sky/80">
                Draft
              </span>
            )}
          </button>
        ))}
        {unassignedCount > 0 && (
          <button
            type="button"
            onClick={() => selectModule(UNASSIGNED)}
            aria-current={activeModule === UNASSIGNED ? "page" : undefined}
            className={cx(ui.chip(activeModule === UNASSIGNED), ui.focus)}
          >
            Unassigned ({unassignedCount})
          </button>
        )}
        {!loading && moduleList.length === 0 && (
          <p className={ui.hint}>
            No modules yet. Create your first module, e.g. Pitch Geography.
          </p>
        )}
      </nav>

      {currentModule && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={cx(button.secondary, button.small)}
            onClick={() =>
              setModuleDialog({ open: true, module: currentModule })
            }
          >
            Edit module
          </button>
          <button
            type="button"
            className={cx(button.secondary, button.small)}
            onClick={() => moveModule(-1)}
            disabled={moduleList[0]?._id === currentModule._id}
          >
            Move left
          </button>
          <button
            type="button"
            className={cx(button.secondary, button.small)}
            onClick={() => moveModule(1)}
            disabled={moduleList.at(-1)?._id === currentModule._id}
          >
            Move right
          </button>
          <button
            type="button"
            className={cx(button.primary, button.small)}
            onClick={() => {
              setSelectedId(null);
              setMode({ kind: "create", parentId: null });
            }}
          >
            Add topic
          </button>
        </div>
      )}
      {activeModule === UNASSIGNED && (
        <p className={cx(ui.hint, "mb-4")}>
          These topics were made before modules existed. Open one, choose a
          module for it, and save.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
        {/* Preview */}
        <section aria-label="Tree preview" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div
              className="flex gap-1"
              role="group"
              aria-label="Preview as position"
            >
              {["ALL", ...POSITIONS].map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={position === p}
                  onClick={() => setPosition(p)}
                  className={cx(
                    ui.chip(position === p),
                    ui.focus,
                    "px-2.5 py-1 text-xs",
                  )}
                >
                  {p === "ALL" ? "All positions" : p}
                </button>
              ))}
            </div>
            <select
              aria-label="Preview a player's progress"
              value={previewPlayer}
              onChange={(e) => setPreviewPlayer(e.target.value)}
              className={cx(ui.input, "w-auto py-1 text-xs")}
            >
              <option value="">No player preview</option>
              {(players.data ?? []).map((p) => (
                <option key={p._id} value={p._id}>
                  #{p.number} {playerName(p)}
                </option>
              ))}
            </select>
          </div>

          {trees.loading && !trees.data ? (
            <div
              className={cx(card, "flex h-[520px] items-center justify-center")}
            >
              <p className={ui.hint}>Loading tree…</p>
            </div>
          ) : activeTree && activeTree.tree.children.length > 0 ? (
            <SkillTreePreview
              data={activeTree.tree}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setMode({ kind: "view" });
              }}
              showStatus={Boolean(previewPlayer)}
            />
          ) : (
            <div
              className={cx(
                card,
                "flex h-[520px] flex-col items-center justify-center gap-3 px-6 text-center",
              )}
            >
              <p className="font-body text-sm text-sky/70">
                {position !== "ALL"
                  ? `No topics in this module for ${position}.`
                  : "This module has no topics yet. Add the first one to start the tree."}
              </p>
            </div>
          )}
          <p className={cx(ui.hint, "mt-2")}>
            Click a topic to select it. Dashed topics are shown only as context
            for the chosen position. A small dot means the topic has a lesson.
            {previewPlayer && " Colors show the player's status."}
          </p>
        </section>

        {/* Side panel */}
        <section
          aria-label="Topic details"
          className={cx(card, "self-start p-5")}
        >
          {mode.kind === "create" || mode.kind === "edit" ? (
            <>
              <h2 className="mb-4 font-display text-xl font-bold text-mist">
                {mode.kind === "edit"
                  ? "Edit topic"
                  : mode.parentId
                    ? "Add subtopic"
                    : "Add topic"}
              </h2>
              <TopicForm
                node={mode.kind === "edit" ? selected : null}
                nodes={allNodes}
                modules={moduleList}
                defaultModuleId={
                  activeModule === UNASSIGNED ? null : activeModule
                }
                defaultParentId={mode.kind === "create" ? mode.parentId : null}
                onSaved={(saved) => {
                  refreshAll();
                  setSelectedId(saved._id);
                  setMode({ kind: "view" });
                  if (saved.moduleId && saved.moduleId !== activeModule)
                    setActiveModule(saved.moduleId);
                }}
                onCancel={() => setMode({ kind: "view" })}
              />
            </>
          ) : selected ? (
            <TopicDetails
              node={selected}
              onEdit={() => setMode({ kind: "edit" })}
              onAddSubtopic={() =>
                setMode({ kind: "create", parentId: selected._id })
              }
              onDelete={() => setConfirmDelete(true)}
              onProgressChanged={() => trees.reload()}
            />
          ) : (
            <p className="py-10 text-center font-body text-sm text-sky/70">
              Select a topic in the tree, or add a new one.
            </p>
          )}
        </section>
      </div>

      <ModuleDialog
        open={moduleDialog.open}
        module={moduleDialog.module}
        onClose={() => setModuleDialog({ open: false, module: null })}
        onSaved={(m) => {
          setModuleDialog({ open: false, module: null });
          setActiveModule(m._id);
          refreshAll();
        }}
        onDeleted={() => {
          setModuleDialog({ open: false, module: null });
          setActiveModule(null);
          refreshAll();
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${selected?.title ?? ""}”?`}
        message="Its subtopics move up one level and players' progress on it is removed. Topics that still have tasks or badges can't be deleted."
        confirmLabel="Delete topic"
        danger
        busy={busy}
        onConfirm={deleteTopic}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

interface LinkedTask {
  _id: string;
  type: string;
  title: string;
  isArchived: boolean;
}
interface LinkedBadge {
  _id: string;
  title: string;
  source: string;
  holderCount: number;
}
interface ProgressRow {
  nodeId: string;
  status: string;
}

function TopicDetails({
  node,
  onEdit,
  onAddSubtopic,
  onDelete,
  onProgressChanged,
}: {
  node: RawNode;
  onEdit: () => void;
  onAddSubtopic: () => void;
  onDelete: () => void;
  onProgressChanged: () => void;
}) {
  const { show } = useToast();
  const players = usePlayers();
  const tasks = useCached<LinkedTask[]>(`/api/tasks?skillNodeId=${node._id}`);
  const badges = useCached<LinkedBadge[]>(
    `/api/badges?skillNodeId=${node._id}`,
  );

  const [audience, setAudience] = useState<AudienceValue>(DEFAULT_AUDIENCE);
  const [opening, setOpening] = useState(false);
  const [statusPlayer, setStatusPlayer] = useState("");
  const progress = useCached<ProgressRow[]>(
    statusPlayer ? `/api/skill-tree/progress?playerId=${statusPlayer}` : null,
  );
  const currentStatus =
    progress.data?.find((r) => String(r.nodeId) === node._id)?.status ??
    "LOCKED";

  useEffect(() => setAudience(DEFAULT_AUDIENCE), [node._id]);

  async function openTopic() {
    const api = toApiAudience(audience);
    if (!api) return;
    setOpening(true);
    try {
      const res = await sendJson<Parameters<typeof openTopicMessage>[0]>(
        `/api/skill-tree/${node._id}/open`,
        "POST",
        { audience: api },
      );
      show(openTopicMessage(res));
      onProgressChanged();
      progress.reload();
    } catch (err) {
      show(errorMessage(err, "Couldn't open the topic"));
    } finally {
      setOpening(false);
    }
  }

  async function setStatus(status: string) {
    if (!statusPlayer) return;
    try {
      const res = await sendJson<{ awardedBadges: { title: string }[] }>(
        "/api/skill-tree/progress",
        "PATCH",
        {
          playerId: statusPlayer,
          nodeId: node._id,
          status,
        },
      );
      show({
        tone: "success",
        title: `Set to ${PROGRESS_STATUS[status].label}`,
        detail: res.awardedBadges.length
          ? [
              `Branch badges: ${res.awardedBadges.map((b) => b.title).join(", ")}.`,
            ]
          : [],
      });
      progress.reload();
      onProgressChanged();
    } catch (err) {
      show(errorMessage(err, "Couldn't change the status"));
    }
  }

  const lesson = node.lesson ?? {};
  const hasLesson = Boolean(
    lesson.videoUrl || lesson.diagramUrl || lesson.keyPoints?.length,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-mist">
          {node.title}
        </h2>
        {node.titleEn && (
          <p className="font-body text-sm text-sky/70">{node.titleEn}</p>
        )}
        <p className={cx(ui.hint, "mt-2")}>
          For{" "}
          {(node.positions?.length ? node.positions : ["ALL"])
            .map((p) => (p === "ALL" ? "everyone" : p))
            .join(", ")}
          {"; "}
          {(node.levels ?? ["U11"]).join(", ")}
          {node.prerequisites?.length
            ? `; ${plural(node.prerequisites.length, "prerequisite")}`
            : ""}
        </p>
        {node.description && (
          <p className="mt-3 font-body text-sm text-sky">{node.description}</p>
        )}
        <p className={cx(ui.hint, "mt-2")}>
          {hasLesson
            ? "Has a lesson."
            : "No lesson yet. Add a video or key points so players can learn it."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className={cx(button.secondary, button.small)}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onAddSubtopic}
            className={cx(button.secondary, button.small)}
          >
            Add subtopic
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cx(button.danger, button.small)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="border-t border-sky/10 pt-5">
        <h3 className="mb-3 font-display text-base font-bold text-mist">
          Open for players
        </h3>
        <AudiencePicker
          value={audience}
          onChange={setAudience}
          label="Open this topic for"
        />
        <button
          type="button"
          onClick={openTopic}
          disabled={opening || !toApiAudience(audience)}
          className={cx(button.primary, "mt-3 w-full")}
        >
          {opening ? "Opening…" : "Open topic"}
        </button>
      </div>

      <div className="border-t border-sky/10 pt-5">
        <h3 className="mb-3 font-display text-base font-bold text-mist">
          Player status
        </h3>
        <select
          aria-label="Player"
          value={statusPlayer}
          onChange={(e) => setStatusPlayer(e.target.value)}
          className={ui.input}
        >
          <option value="">Choose a player</option>
          {(players.data ?? []).map((p) => (
            <option key={p._id} value={p._id}>
              #{p.number} {playerName(p)}
            </option>
          ))}
        </select>
        {statusPlayer && (
          <>
            <p className={cx(ui.hint, "mt-2 flex items-center gap-2")}>
              Now: <StatusPill {...PROGRESS_STATUS[currentStatus]} />
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(PROGRESS_STATUS).map(([key, s]) => (
                <button
                  key={key}
                  type="button"
                  disabled={key === currentStatus}
                  onClick={() => setStatus(key)}
                  className={cx(button.secondary, button.small)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-sky/10 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-mist">Tasks</h3>
          <Link
            href={`/admin/tasks/new?topic=${node._id}`}
            className={cx(ui.textButton, ui.focus)}
          >
            New task
          </Link>
        </div>
        {tasks.loading && <p className={ui.hint}>Loading…</p>}
        {tasks.data?.length === 0 && (
          <p className={ui.hint}>
            No tasks yet. Add a puzzle or field check to test this topic.
          </p>
        )}
        <ul className="space-y-1">
          {tasks.data?.map((t) => (
            <li key={t._id}>
              <Link
                href={`/admin/tasks/${t._id}`}
                className="flex justify-between gap-2 rounded px-2 py-1.5 font-body text-sm text-mist hover:bg-white/[0.03]"
              >
                <span className="truncate">{t.title}</span>
                <span className={ui.hint}>{TASK_TYPE_LABEL[t.type]}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mb-2 mt-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-mist">Badges</h3>
          <Link href="/admin/badges" className={cx(ui.textButton, ui.focus)}>
            Manage badges
          </Link>
        </div>
        {badges.data?.length === 0 && (
          <p className={ui.hint}>No badges linked to this topic.</p>
        )}
        <ul className="space-y-1">
          {badges.data?.map((b) => (
            <li
              key={b._id}
              className="flex justify-between gap-2 px-2 py-1.5 font-body text-sm text-mist"
            >
              <span className="truncate">{b.title}</span>
              <span className={ui.hint}>{plural(b.holderCount, "holder")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
