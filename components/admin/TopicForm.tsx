// Path: components/admin/TopicForm.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import TopicPicker from "./TopicPicker";
import { useToast } from "./ResultToast";
import { errorMessage } from "./resultMessages";
import { POSITIONS, button, cx, ui } from "./ui";
import { sendJson } from "./useAdminData";
import type { ModuleRecord } from "./ModuleDialog";

export interface RawNode {
  _id: string;
  title: string;
  titleEn?: string;
  description?: string;
  moduleId?: string | null;
  parentId?: string | null;
  sequenceOrder?: number;
  positions?: string[];
  levels?: string[];
  prerequisites?: string[];
  lesson?: { videoUrl?: string; diagramUrl?: string; keyPoints?: string[] };
}

const LEVELS = ["U11", "U15", "PRO"] as const;

interface Props {
  /** null = create */
  node: RawNode | null;
  nodes: RawNode[];
  modules: ModuleRecord[];
  defaultModuleId: string | null;
  defaultParentId: string | null;
  onSaved: (node: RawNode) => void;
  onCancel: () => void;
}

function descendantsOf(id: string, nodes: RawNode[]): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const n of nodes) {
      if (n.parentId === current && !out.has(n._id)) {
        out.add(n._id);
        stack.push(n._id);
      }
    }
  }
  return out;
}

export default function TopicForm({
  node,
  nodes,
  modules,
  defaultModuleId,
  defaultParentId,
  onSaved,
  onCancel,
}: Props) {
  const { show } = useToast();
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [sequenceOrder, setSequenceOrder] = useState<string>("");
  const [positions, setPositions] = useState<string[]>(["ALL"]);
  const [levels, setLevels] = useState<string[]>(["U11"]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(node?.title ?? "");
    setTitleEn(node?.titleEn ?? "");
    setDescription(node?.description ?? "");
    setModuleId(node?.moduleId ?? defaultModuleId ?? modules[0]?._id ?? "");
    setParentId(node ? (node.parentId ?? "") : (defaultParentId ?? ""));
    setSequenceOrder(
      node?.sequenceOrder !== undefined ? String(node.sequenceOrder) : "",
    );
    setPositions(node?.positions?.length ? node.positions : ["ALL"]);
    setLevels(node?.levels?.length ? node.levels : ["U11"]);
    setPrerequisites(node?.prerequisites?.map(String) ?? []);
    setVideoUrl(node?.lesson?.videoUrl ?? "");
    setDiagramUrl(node?.lesson?.diagramUrl ?? "");
    setKeyPoints(
      node?.lesson?.keyPoints?.length ? node.lesson.keyPoints : [""],
    );
    setErrors({});
  }, [node, defaultModuleId, defaultParentId, modules]);

  const parentOptions = useMemo(() => {
    const blocked = node ? descendantsOf(node._id, nodes) : new Set<string>();
    if (node) blocked.add(node._id);
    return nodes.filter((n) => n.moduleId === moduleId && !blocked.has(n._id));
  }, [nodes, node, moduleId]);

  const titleById = useMemo(
    () => new Map(nodes.map((n) => [n._id, n.title])),
    [nodes],
  );

  function togglePosition(p: string) {
    if (p === "ALL") return setPositions(["ALL"]);
    const current = positions.filter((x) => x !== "ALL");
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    setPositions(next.length === 0 ? ["ALL"] : next);
  }

  function toggleLevel(l: string) {
    const next = levels.includes(l)
      ? levels.filter((x) => x !== l)
      : [...levels, l];
    if (next.length > 0) setLevels(next);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "The Georgian title is required.";
    if (!moduleId) next.moduleId = "Pick a module.";
    if (sequenceOrder && !/^\d+$/.test(sequenceOrder))
      next.sequenceOrder = "Use a whole number, 0 or more.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const body: Record<string, unknown> = {
      title: title.trim(),
      titleEn: titleEn.trim(),
      description: description.trim(),
      moduleId,
      parentId: parentId || null,
      positions,
      levels,
      prerequisites,
      lesson: {
        videoUrl: videoUrl.trim(),
        diagramUrl: diagramUrl.trim(),
        keyPoints: keyPoints.map((k) => k.trim()).filter(Boolean),
      },
    };
    if (sequenceOrder !== "") body.sequenceOrder = Number(sequenceOrder);

    setSaving(true);
    try {
      const saved = node
        ? await sendJson<RawNode>(`/api/skill-tree/${node._id}`, "PATCH", body)
        : await sendJson<RawNode>("/api/skill-tree", "POST", body);
      show({
        tone: "success",
        title: node ? `Saved “${saved.title}”` : `Added “${saved.title}”`,
      });
      onSaved(saved);
    } catch (err) {
      show(errorMessage(err, "Couldn't save the topic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="t-title" className={ui.label}>
            Title (Georgian)
          </label>
          <input
            id="t-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ზონა 14"
            className={ui.input}
          />
          {errors.title && (
            <p className={cx(ui.error, "mt-1")}>{errors.title}</p>
          )}
        </div>
        <div>
          <label htmlFor="t-title-en" className={ui.label}>
            Title (English)
          </label>
          <input
            id="t-title-en"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Zone 14"
            className={ui.input}
          />
        </div>
      </div>

      <div>
        <label htmlFor="t-desc" className={ui.label}>
          Description
        </label>
        <textarea
          id="t-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={ui.input}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_7rem]">
        <div>
          <label htmlFor="t-module" className={ui.label}>
            Module
          </label>
          <select
            id="t-module"
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              setParentId("");
            }}
            className={ui.input}
          >
            {!moduleId && <option value="">Choose a module</option>}
            {modules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title.ka}
              </option>
            ))}
          </select>
          {errors.moduleId && (
            <p className={cx(ui.error, "mt-1")}>{errors.moduleId}</p>
          )}
        </div>
        <div>
          <label htmlFor="t-parent" className={ui.label}>
            Parent topic
          </label>
          <select
            id="t-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={ui.input}
          >
            <option value="">None (top of the module)</option>
            {parentOptions.map((n) => (
              <option key={n._id} value={n._id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="t-order" className={ui.label}>
            Order
          </label>
          <input
            id="t-order"
            inputMode="numeric"
            value={sequenceOrder}
            onChange={(e) => setSequenceOrder(e.target.value)}
            placeholder="Last"
            className={ui.input}
          />
          {errors.sequenceOrder && (
            <p className={cx(ui.error, "mt-1")}>{errors.sequenceOrder}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className={ui.label}>Positions</legend>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", ...POSITIONS].map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={positions.includes(p)}
                onClick={() => togglePosition(p)}
                className={cx(
                  ui.chip(positions.includes(p)),
                  ui.focus,
                  "px-2.5 py-1 text-xs",
                )}
              >
                {p === "ALL" ? "Everyone" : p}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className={ui.label}>Levels</legend>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={levels.includes(l)}
                onClick={() => toggleLevel(l)}
                className={cx(
                  ui.chip(levels.includes(l)),
                  ui.focus,
                  "px-2.5 py-1 text-xs",
                )}
              >
                {l === "PRO" ? "Pro" : l}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <TopicPicker
          label="Prerequisites"
          value={null}
          placeholder="Add a topic players should master first"
          onChange={(id) => {
            if (id && id !== node?._id && !prerequisites.includes(id))
              setPrerequisites([...prerequisites, id]);
          }}
        />
        {prerequisites.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {prerequisites.map((id) => (
              <li
                key={id}
                className="flex items-center gap-1.5 rounded-md bg-white/[0.06] py-1 pl-2.5 pr-1 font-body text-xs text-mist"
              >
                {titleById.get(id) ?? "Unknown topic"}
                <button
                  type="button"
                  onClick={() =>
                    setPrerequisites(prerequisites.filter((p) => p !== id))
                  }
                  aria-label={`Remove ${titleById.get(id) ?? "prerequisite"}`}
                  className={cx(
                    "rounded px-1 text-sky/60 hover:text-mist",
                    ui.focus,
                  )}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <fieldset className="space-y-3 rounded-lg border border-sky/10 p-4">
        <legend className="px-1 font-display text-sm font-bold text-mist">
          Lesson
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="t-video" className={ui.label}>
              Video link
            </label>
            <input
              id="t-video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.tiktok.com/…"
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="t-diagram" className={ui.label}>
              Diagram link
            </label>
            <input
              id="t-diagram"
              type="url"
              value={diagramUrl}
              onChange={(e) => setDiagramUrl(e.target.value)}
              placeholder="https://…"
              className={ui.input}
            />
          </div>
        </div>
        <div>
          <span className={ui.label}>Key points (up to 5)</span>
          <div className="space-y-2">
            {keyPoints.map((k, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={k}
                  aria-label={`Key point ${i + 1}`}
                  onChange={(e) =>
                    setKeyPoints(
                      keyPoints.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                  className={ui.input}
                />
                {keyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setKeyPoints(keyPoints.filter((_, j) => j !== i))
                    }
                    aria-label={`Remove key point ${i + 1}`}
                    className={cx(button.secondary, button.small)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {keyPoints.length < 5 && (
            <button
              type="button"
              onClick={() => setKeyPoints([...keyPoints, ""])}
              className={cx(ui.textButton, ui.focus, "mt-2")}
            >
              Add a key point
            </button>
          )}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-sky/10 pt-4">
        <button type="button" onClick={onCancel} className={button.secondary}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={button.primary}>
          {saving ? "Saving…" : node ? "Save topic" : "Add topic"}
        </button>
      </div>
    </form>
  );
}
