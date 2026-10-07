// Path: app/admin/badges/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Modal from "@/components/admin/Modal";
import PlayerMultiSelect from "@/components/admin/PlayerMultiSelect";
import { useToast } from "@/components/admin/ResultToast";
import { awardMessage, errorMessage } from "@/components/admin/resultMessages";
import TopicPicker from "@/components/admin/TopicPicker";
import {
  BADGE_SOURCE_LABEL,
  button,
  card,
  cx,
  formatDate,
  playerName,
  plural,
  ui,
} from "@/components/admin/ui";
import {
  PlayerOption,
  invalidateAdminData,
  sendJson,
  useCached,
} from "@/components/admin/useAdminData";

interface BadgeRow {
  _id: string;
  title: string;
  description: string;
  iconUrl: string | null;
  category: "DISCIPLINE" | "TACTICAL" | "MILESTONE";
  xpReward: number;
  source: "TASK" | "BRANCH" | "MANUAL";
  skillNodeId: string | null;
  isArchived: boolean;
  holderCount: number;
  topic: { title: string; titleEn?: string } | null;
}

interface Holder {
  _id: string;
  playerId: PlayerOption | null;
  awardSource: "AUTO" | "COACH";
  note: string;
  createdAt: string;
}

const FILTERS = [
  { key: "", label: "All" },
  { key: "TASK", label: "Task badges" },
  { key: "BRANCH", label: "Branch badges" },
  { key: "MANUAL", label: "Coach badges" },
] as const;

const SOURCE_HELP: Record<BadgeRow["source"], string> = {
  TASK: "Earned by passing a task. Link it from the task itself.",
  BRANCH:
    "Given automatically when a player masters the chosen topic and everything under it.",
  MANUAL: "Only given by you, from the Award button.",
};

export default function BadgesPage() {
  const { show } = useToast();
  const [filter, setFilter] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const q = new URLSearchParams();
  if (filter) q.set("source", filter);
  if (showArchived) q.set("includeArchived", "true");
  const badges = useCached<BadgeRow[]>(`/api/badges?${q}`);

  const [editing, setEditing] = useState<BadgeRow | "new" | null>(null);
  const [awarding, setAwarding] = useState<BadgeRow | null>(null);
  const [archiving, setArchiving] = useState<BadgeRow | null>(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    invalidateAdminData();
    badges.reload();
  }

  async function archive() {
    if (!archiving) return;
    setBusy(true);
    try {
      await sendJson(`/api/badges/${archiving._id}`, "DELETE");
      show({
        tone: "success",
        title: `Archived “${archiving.title}”`,
        detail: ["Players keep it if they already earned it."],
      });
      setArchiving(null);
      refresh();
    } catch (err) {
      show(errorMessage(err, "Couldn't archive the badge"));
    } finally {
      setBusy(false);
    }
  }

  const rows = badges.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <AdminHeader
        title="Badges"
        description="Rewards for passing tasks, mastering branches, or anything you see on the pitch."
        actions={
          <button
            type="button"
            className={button.primary}
            onClick={() => setEditing("new")}
          >
            New badge
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter badges"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cx(ui.chip(filter === f.key), ui.focus)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-body text-sm text-sky/80">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-[#018ABE]"
          />
          Show archived
        </label>
      </div>

      <div className={cx(card, "divide-y divide-sky/10")}>
        {badges.loading && (
          <p className={cx(ui.hint, "p-5")}>Loading badges…</p>
        )}
        {badges.error && (
          <p className={cx(ui.error, "p-5")}>
            Couldn&apos;t load badges: {badges.error}
          </p>
        )}
        {!badges.loading && !badges.error && rows.length === 0 && (
          <p className={cx(ui.hint, "p-8 text-center")}>
            No badges here yet. Create one, or switch on “create badge” when you
            make a task.
          </p>
        )}
        {rows.map((b) => (
          <div
            key={b._id}
            className={cx(
              "flex flex-wrap items-center gap-4 p-4",
              b.isArchived && "opacity-50",
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
              {b.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.iconUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="font-display text-lg font-bold text-sky/70"
                  aria-hidden
                >
                  {b.title.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-semibold text-mist">
                {b.title}
                {b.isArchived && (
                  <span className="ml-2 font-normal text-sky/60">
                    (archived)
                  </span>
                )}
              </p>
              <p className={ui.hint}>
                {BADGE_SOURCE_LABEL[b.source]}
                {b.topic ? `, ${b.topic.title}` : ""}
                {`, ${b.xpReward} XP, ${plural(b.holderCount, "holder")}`}
              </p>
            </div>
            {!b.isArchived && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cx(button.primary, button.small)}
                  onClick={() => setAwarding(b)}
                >
                  Award
                </button>
                <button
                  type="button"
                  className={cx(button.secondary, button.small)}
                  onClick={() => setEditing(b)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cx(button.secondary, button.small)}
                  onClick={() => setArchiving(b)}
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <BadgeEditor
        badge={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
      <AwardDialog
        badge={awarding}
        onClose={() => setAwarding(null)}
        onAwarded={() => {
          setAwarding(null);
          refresh();
        }}
      />
      <ConfirmDialog
        open={archiving !== null}
        title={`Archive “${archiving?.title ?? ""}”?`}
        message="Nobody can earn it anymore. Players who already have it keep it."
        confirmLabel="Archive badge"
        danger
        busy={busy}
        onConfirm={archive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}

function BadgeEditor({
  badge,
  open,
  onClose,
  onSaved,
}: {
  badge: BadgeRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { show } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [category, setCategory] = useState<BadgeRow["category"]>("TACTICAL");
  const [xp, setXp] = useState("50");
  const [source, setSource] = useState<BadgeRow["source"]>("MANUAL");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(badge?.title ?? "");
    setDescription(badge?.description ?? "");
    setIconUrl(badge?.iconUrl ?? "");
    setCategory(badge?.category ?? "TACTICAL");
    setXp(String(badge?.xpReward ?? 50));
    setSource(badge?.source ?? "MANUAL");
    setTopicId(badge?.skillNodeId ? String(badge.skillNodeId) : null);
    setErrors({});
  }, [open, badge]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Give the badge a name.";
    if (!/^\d+$/.test(xp)) next.xp = "Use a whole number, 0 or more.";
    if (source === "BRANCH" && !topicId)
      next.topic = "Pick the branch this badge rewards.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        iconUrl: iconUrl.trim() || null,
        category,
        xpReward: Number(xp),
        source,
        skillNodeId: topicId,
      };
      if (badge) await sendJson(`/api/badges/${badge._id}`, "PATCH", body);
      else await sendJson("/api/badges", "POST", body);
      show({
        tone: "success",
        title: badge ? `Saved “${body.title}”` : `Created “${body.title}”`,
      });
      onSaved();
    } catch (err) {
      show(errorMessage(err, "Couldn't save the badge"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={badge ? "Edit badge" : "New badge"}
      footer={
        <>
          <button type="button" onClick={onClose} className={button.secondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="badge-form"
            disabled={saving}
            className={button.primary}
          >
            {saving ? "Saving…" : badge ? "Save badge" : "Create badge"}
          </button>
        </>
      }
    >
      <form id="badge-form" onSubmit={save} className="space-y-4">
        <div>
          <label htmlFor="b-title" className={ui.label}>
            Name
          </label>
          <input
            id="b-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Space Master"
            className={ui.input}
          />
          {errors.title && (
            <p className={cx(ui.error, "mt-1")}>{errors.title}</p>
          )}
        </div>
        <div>
          <label htmlFor="b-desc" className={ui.label}>
            What it&apos;s for
          </label>
          <textarea
            id="b-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={ui.input}
          />
        </div>

        <fieldset>
          <legend className={ui.label}>How players get it</legend>
          <div className="flex flex-wrap gap-2">
            {(["MANUAL", "BRANCH", "TASK"] as const).map((s) => (
              <label
                key={s}
                className={cx(ui.chip(source === s), "cursor-pointer")}
              >
                <input
                  type="radio"
                  name="badge-source"
                  className="sr-only"
                  checked={source === s}
                  onChange={() => setSource(s)}
                />
                {BADGE_SOURCE_LABEL[s]}
              </label>
            ))}
          </div>
          <p className={cx(ui.hint, "mt-2")}>{SOURCE_HELP[source]}</p>
        </fieldset>

        <TopicPicker
          label={source === "BRANCH" ? "Branch" : "Topic (optional)"}
          value={topicId}
          onChange={(id) => setTopicId(id)}
          required={source === "BRANCH"}
          error={errors.topic}
          hint={
            source === "BRANCH"
              ? "Players earn it when this topic and every topic under it are mastered."
              : undefined
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="b-xp" className={ui.label}>
              XP
            </label>
            <input
              id="b-xp"
              inputMode="numeric"
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              className={ui.input}
            />
            {errors.xp && <p className={cx(ui.error, "mt-1")}>{errors.xp}</p>}
          </div>
          <div>
            <label htmlFor="b-cat" className={ui.label}>
              Category
            </label>
            <select
              id="b-cat"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as BadgeRow["category"])
              }
              className={ui.input}
            >
              <option value="TACTICAL">Tactical</option>
              <option value="MILESTONE">Milestone</option>
              <option value="DISCIPLINE">Discipline</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="b-icon" className={ui.label}>
            Icon image link (optional)
          </label>
          <input
            id="b-icon"
            type="url"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://…"
            className={ui.input}
          />
        </div>
      </form>
    </Modal>
  );
}

function AwardDialog({
  badge,
  onClose,
  onAwarded,
}: {
  badge: BadgeRow | null;
  onClose: () => void;
  onAwarded: () => void;
}) {
  const { show } = useToast();
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const detail = useCached<{ holders: Holder[] }>(
    badge ? `/api/badges/${badge._id}` : null,
  );
  const holders = detail.data?.holders ?? [];

  useEffect(() => {
    setPlayerIds([]);
    setNote("");
  }, [badge?._id]);

  async function award() {
    if (!badge || playerIds.length === 0) return;
    setSaving(true);
    try {
      const res = await sendJson<{ awarded: string[]; alreadyHad: string[] }>(
        `/api/badges/${badge._id}/award`,
        "POST",
        { playerIds, note: note.trim() },
      );
      show(awardMessage(res, badge.title));
      onAwarded();
    } catch (err) {
      show(errorMessage(err, "Couldn't award the badge"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={badge !== null}
      onClose={onClose}
      title={`Award “${badge?.title ?? ""}”`}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={button.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={award}
            disabled={saving || playerIds.length === 0}
            className={button.primary}
          >
            {saving
              ? "Awarding…"
              : playerIds.length
                ? `Award to ${plural(playerIds.length, "player")}`
                : "Award"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <PlayerMultiSelect
          value={playerIds}
          onChange={setPlayerIds}
          label="Award to"
          listHeight="max-h-56"
        />
        <div>
          <label htmlFor="award-note" className={ui.label}>
            Note (optional)
          </label>
          <input
            id="award-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Great pressing in Saturday's match"
            className={ui.input}
          />
        </div>
        <div>
          <h3 className={ui.label}>Already earned by</h3>
          {detail.loading && <p className={ui.hint}>Loading…</p>}
          {!detail.loading && holders.length === 0 && (
            <p className={ui.hint}>Nobody yet.</p>
          )}
          <ul className="space-y-1">
            {holders.map((h) => (
              <li
                key={h._id}
                className="flex justify-between gap-3 font-body text-sm text-mist"
              >
                <span>{playerName(h.playerId)}</span>
                <span className={ui.hint}>
                  {h.awardSource === "AUTO" ? "Earned" : "Given by coach"},{" "}
                  {formatDate(h.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
