// Path: components/admin/MasteryQueue.tsx
"use client";

import { useMemo, useState } from "react";
import { useToast } from "./ResultToast";
import { errorMessage, masteryMessage } from "./resultMessages";
import {
  POSITION_COLOR,
  Position,
  button,
  card,
  cx,
  formatDate,
  plural,
  ui,
} from "./ui";
import { invalidateAdminData, sendJson, useCached } from "./useAdminData";

interface ReadyRow {
  playerId: string;
  nodeId: string;
  tasksPassed: number;
  lastPassedAt: string | null;
  player: { name: string; surname: string; number: number; position: Position };
  topic: { title: string; titleEn?: string };
}

/** Players who passed every task on a topic and are waiting for your confirmation. */
export default function MasteryQueue() {
  const { show } = useToast();
  const ready = useCached<ReadyRow[]>("/api/mastery/ready");
  const [busy, setBusy] = useState<string | null>(null);

  const byTopic = useMemo(() => {
    const groups = new Map<
      string,
      { title: string; titleEn?: string; rows: ReadyRow[] }
    >();
    for (const r of ready.data ?? []) {
      const key = String(r.nodeId);
      const g = groups.get(key) ?? {
        title: r.topic.title,
        titleEn: r.topic.titleEn,
        rows: [],
      };
      g.rows.push(r);
      groups.set(key, g);
    }
    return [...groups.entries()];
  }, [ready.data]);

  async function confirm(rows: ReadyRow[], key: string) {
    setBusy(key);
    try {
      const res = await sendJson<Parameters<typeof masteryMessage>[0]>(
        "/api/mastery/confirm",
        "POST",
        {
          items: rows.map((r) => ({ playerId: r.playerId, nodeId: r.nodeId })),
        },
      );
      show(masteryMessage(res));
      invalidateAdminData();
      ready.reload();
    } catch (err) {
      show(errorMessage(err, "Couldn't confirm mastery"));
    } finally {
      setBusy(null);
    }
  }

  const total = ready.data?.length ?? 0;

  return (
    <section aria-label="Ready for mastery" className={cx(card, "p-5")}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-mist">
          Ready for mastery
        </h2>
        {total > 0 && (
          <span className={ui.hint}>
            {plural(total, "confirmation")} waiting
          </span>
        )}
      </div>

      {ready.loading && !ready.data && <p className={ui.hint}>Loading…</p>}
      {ready.error && (
        <p className={ui.error}>Couldn&apos;t load the queue: {ready.error}</p>
      )}
      {!ready.loading && !ready.error && total === 0 && (
        <p className={ui.hint}>
          Nobody is waiting. Players appear here once they pass every task on a
          topic.
        </p>
      )}

      <div className="space-y-5">
        {byTopic.map(([nodeId, group]) => (
          <div key={nodeId}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-body text-sm font-semibold text-mist">
                {group.title}
                {group.titleEn && (
                  <span className="font-normal text-sky/60">
                    {" "}
                    ({group.titleEn})
                  </span>
                )}
              </h3>
              {group.rows.length > 1 && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => confirm(group.rows, nodeId)}
                  className={cx(button.secondary, button.small)}
                >
                  {busy === nodeId
                    ? "Confirming…"
                    : `Confirm all ${group.rows.length}`}
                </button>
              )}
            </div>
            <ul className="divide-y divide-sky/10 rounded-md border border-sky/10">
              {group.rows.map((r) => {
                const key = `${r.playerId}:${r.nodeId}`;
                return (
                  <li key={key} className="flex items-center gap-3 px-3 py-2">
                    <span
                      className="flex h-6 w-7 shrink-0 items-center justify-center rounded font-display text-xs font-bold text-white"
                      style={{
                        backgroundColor: POSITION_COLOR[r.player.position],
                      }}
                      aria-hidden
                    >
                      {r.player.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-sm text-mist">
                        {r.player.name} {r.player.surname}
                      </span>
                      <span className={ui.hint}>
                        Passed {plural(r.tasksPassed, "task")}
                        {r.lastPassedAt
                          ? `, last on ${formatDate(r.lastPassedAt)}`
                          : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => confirm([r], key)}
                      className={cx(button.primary, button.small)}
                    >
                      {busy === key ? "Confirming…" : "Mark mastered"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
