// Path: app/admin/groups/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import PlayerMultiSelect from "@/components/admin/PlayerMultiSelect";
import { useToast } from "@/components/admin/ResultToast";
import { errorMessage } from "@/components/admin/resultMessages";
import { button, card, cx, plural, ui } from "@/components/admin/ui";
import {
  GroupOption,
  invalidateAdminData,
  sendJson,
  useGroups,
} from "@/components/admin/useAdminData";

const SWATCHES = [
  "#018ABE",
  "#1FA97A",
  "#E0A72F",
  "#E8735C",
  "#8E6CEF",
  "#D45AA0",
  "#5FB4C9",
  "#9AA7B1",
];

interface Draft {
  _id: string | null;
  name: string;
  description: string;
  color: string;
  playerIds: string[];
}

const EMPTY: Draft = {
  _id: null,
  name: "",
  description: "",
  color: SWATCHES[0],
  playerIds: [],
};

function toDraft(g: GroupOption): Draft {
  return {
    _id: g._id,
    name: g.name,
    description: g.description ?? "",
    color: g.color,
    playerIds: g.playerIds.map((p) => p._id),
  };
}

export default function GroupsPage() {
  const { data, loading, error, reload } = useGroups();
  const groups = (data ?? []).filter((g) => !g.isArchived);
  const { show } = useToast();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => setNameError(null), [draft?.name]);

  function refresh() {
    invalidateAdminData("/api/groups");
    reload();
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setNameError("Give the group a name.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        color: draft.color,
        playerIds: draft.playerIds,
      };
      if (draft._id) {
        await sendJson(`/api/groups/${draft._id}`, "PATCH", body);
        show({ tone: "success", title: `Saved “${body.name}”` });
      } else {
        const created = await sendJson<{ _id: string }>(
          "/api/groups",
          "POST",
          body,
        );
        setDraft({ ...draft, _id: created._id });
        show({
          tone: "success",
          title: `Created “${body.name}”`,
          detail: [`${plural(body.playerIds.length, "player")}.`],
        });
      }
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("already exists"))
        setNameError("A group with this name already exists.");
      else show(errorMessage(err, "Couldn't save the group"));
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!draft?._id) return;
    setSaving(true);
    try {
      await sendJson(`/api/groups/${draft._id}`, "DELETE");
      show({
        tone: "success",
        title: `Archived “${draft.name}”`,
        detail: ["Tasks already assigned to it are kept."],
      });
      setDraft(null);
      setConfirmArchive(false);
      refresh();
    } catch (err) {
      show(errorMessage(err, "Couldn't archive the group"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <AdminHeader
        title="Groups"
        description="Custom sets of players, like left-footers or new joiners. Use them to open topics and assign tasks."
        actions={
          <button
            type="button"
            className={button.primary}
            onClick={() => setDraft({ ...EMPTY })}
          >
            New group
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <section aria-label="Groups" className={cx(card, "self-start p-2")}>
          {loading && <p className={cx(ui.hint, "p-3")}>Loading groups…</p>}
          {error && (
            <p className={cx(ui.error, "p-3")}>
              Couldn&apos;t load groups: {error}
            </p>
          )}
          {!loading && !error && groups.length === 0 && (
            <p className={cx(ui.hint, "p-3")}>
              No groups yet. Create one to assign tasks to a set of players.
            </p>
          )}
          <ul>
            {groups.map((g) => (
              <li key={g._id}>
                <button
                  type="button"
                  onClick={() => setDraft(toDraft(g))}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition",
                    ui.focus,
                    draft?._id === g._id
                      ? "bg-ocean/15"
                      : "hover:bg-white/[0.03]",
                  )}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: g.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-body text-sm text-mist">
                    {g.name}
                  </span>
                  <span className={ui.hint}>{g.playerIds.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Group details">
          {!draft ? (
            <div className={cx(card, "px-6 py-16 text-center")}>
              <p className="font-body text-sm text-sky/70">
                Pick a group to edit it, or create a new one.
              </p>
            </div>
          ) : (
            <form onSubmit={save} className={cx(card, "space-y-5 p-6")}>
              <h2 className="font-display text-xl font-bold text-mist">
                {draft._id ? "Edit group" : "New group"}
              </h2>

              <div>
                <label htmlFor="group-name" className={ui.label}>
                  Name
                </label>
                <input
                  id="group-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  maxLength={60}
                  placeholder="Left-footers"
                  className={cx(ui.input, nameError && "border-[#E8735C]")}
                />
                {nameError && (
                  <p className={cx(ui.error, "mt-1")}>{nameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="group-description" className={ui.label}>
                  Description (optional)
                </label>
                <input
                  id="group-description"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  placeholder="What this group is for"
                  className={ui.input}
                />
              </div>

              <fieldset>
                <legend className={ui.label}>Color</legend>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((c) => (
                    <label key={c} className="cursor-pointer">
                      <input
                        type="radio"
                        name="group-color"
                        className="peer sr-only"
                        checked={draft.color === c}
                        onChange={() => setDraft({ ...draft, color: c })}
                        aria-label={c}
                      />
                      <span
                        className="block h-7 w-7 rounded-full ring-offset-2 ring-offset-[#0B2133] peer-checked:ring-2 peer-checked:ring-mist peer-focus-visible:ring-2 peer-focus-visible:ring-ocean"
                        style={{ backgroundColor: c }}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <PlayerMultiSelect
                value={draft.playerIds}
                onChange={(playerIds) => setDraft({ ...draft, playerIds })}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky/10 pt-5">
                {draft._id ? (
                  <button
                    type="button"
                    className={button.danger}
                    onClick={() => setConfirmArchive(true)}
                  >
                    Archive group
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={button.secondary}
                    onClick={() => setDraft(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={button.primary}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving…"
                      : draft._id
                        ? "Save changes"
                        : "Create group"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        title="Archive this group?"
        message="It disappears from pickers. Tasks already assigned through it stay with the players."
        confirmLabel="Archive group"
        danger
        busy={saving}
        onConfirm={archive}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}
