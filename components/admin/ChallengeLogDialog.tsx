// Path: components/admin/ChallengeLogDialog.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import StatusPill from "./StatusPill";
import { useToast } from "./ResultToast";
import { challengeLogMessage, errorMessage } from "./resultMessages";
import {
  ASSIGNMENT_STATUS,
  button,
  cx,
  formatDate,
  playerName,
  ui,
} from "./ui";
import { PlayerOption, sendJson } from "./useAdminData";

export interface ChallengeAssignment {
  _id: string;
  playerId: PlayerOption | null;
  status: string;
  progressCount: number;
  challengeLog: { date: string; success: boolean; note: string }[];
}

interface Props {
  assignment: ChallengeAssignment | null;
  targetCount: number;
  attemptCount: number;
  onClose: () => void;
  onLogged: () => void;
}

export default function ChallengeLogDialog({
  assignment,
  targetCount,
  attemptCount,
  onClose,
  onLogged,
}: Props) {
  const { show } = useToast();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setNote(""), [assignment?._id]);

  if (!assignment) return null;
  const used = assignment.challengeLog.length;
  const active =
    assignment.status === "ASSIGNED" || assignment.status === "IN_PROGRESS";
  const status = ASSIGNMENT_STATUS[assignment.status];

  async function log(success: boolean) {
    if (!assignment) return;
    setSaving(true);
    try {
      const res = await sendJson<Parameters<typeof challengeLogMessage>[0]>(
        `/api/assignments/${assignment._id}/challenge-log`,
        "POST",
        { success, note: note.trim() },
      );
      show(challengeLogMessage(res));
      setNote("");
      onLogged();
    } catch (err) {
      show(errorMessage(err, "Couldn't log the attempt"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={playerName(assignment.playerId)}>
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-2xl font-bold text-mist">
              {assignment.progressCount}{" "}
              <span className="text-base font-normal text-sky/70">
                of {targetCount}
              </span>
            </span>
            <StatusPill {...status} />
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={targetCount}
            aria-valuenow={assignment.progressCount}
            aria-label="Successes"
          >
            <div
              className="h-full rounded-full bg-[#1FA97A]"
              style={{
                width: `${Math.min(100, (assignment.progressCount / targetCount) * 100)}%`,
              }}
            />
          </div>
          <p className={cx(ui.hint, "mt-1")}>
            {used} of {attemptCount} attempts used.
          </p>
        </div>

        {active ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="cl-note" className={ui.label}>
                Note (optional)
              </label>
              <input
                id="cl-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Weak foot, far post"
                className={ui.input}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => log(true)}
                className={cx(
                  button.primary,
                  "bg-[#1FA97A] hover:bg-[#23bf8a]",
                )}
              >
                Made it
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => log(false)}
                className={button.secondary}
              >
                Missed
              </button>
            </div>
          </div>
        ) : (
          <p className={ui.hint}>
            This challenge is finished, so no more attempts can be logged.
          </p>
        )}

        <div>
          <h3 className={ui.label}>Attempts</h3>
          {used === 0 && <p className={ui.hint}>No attempts logged yet.</p>}
          <ol className="space-y-1">
            {[...assignment.challengeLog].reverse().map((entry, i) => (
              <li key={i} className="flex gap-3 font-body text-sm">
                <span
                  className={entry.success ? "text-[#1FA97A]" : "text-sky/60"}
                >
                  {entry.success ? "Made it" : "Missed"}
                </span>
                <span className="flex-1 truncate text-sky/80">
                  {entry.note}
                </span>
                <span className={ui.hint}>{formatDate(entry.date)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}
