// Path: components/player/PuzzlePlayer.tsx
"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cx } from "@/components/admin/ui";
import { copy } from "./copy";
import RewardCard from "./RewardCard";
import { sendJson } from "./api";
import { bigButton, playerFocus } from "./theme";
import type { AnswerResult, FeedItem } from "./types";

interface Props {
  item: FeedItem;
  /** Called when the player taps Continue after finishing, so the parent can refresh. */
  onFinished: () => void;
}

/**
 * Answer a puzzle: two tries, then the right answer and explanation.
 * Finished puzzles open straight into review mode.
 */
export default function PuzzlePlayer({ item, onFinished }: Props) {
  const puzzle = item.task.puzzle;
  const alreadyFinished =
    item.status === "PASSED" ||
    item.status === "NOT_YET" ||
    item.status === "EXPIRED";

  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!puzzle) return null;

  const finished =
    alreadyFinished || (result !== null && result.status !== "IN_PROGRESS");
  const correctId = result?.correctOptionId ?? puzzle.correctOptionId ?? null;
  const explanation = result?.explanation ?? puzzle.explanation ?? null;

  async function check() {
    if (!choice) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await sendJson<AnswerResult>(
        `/api/assignments/${item.assignmentId}/answer`,
        "POST",
        { optionId: choice },
      );
      setResult(res);
      if (!res.isCorrect) {
        setWrong((w) => [...w, choice]);
        setChoice(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-base font-semibold leading-relaxed text-mist">
        {puzzle.question}
      </p>
      {puzzle.diagramUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={puzzle.diagramUrl}
          alt=""
          className="w-full rounded-xl border border-white/10"
        />
      )}

      <div
        role="radiogroup"
        aria-label={copy.puzzle.choose}
        className="space-y-2"
      >
        {puzzle.options.map((o) => {
          const isCorrect = finished && o.id === correctId;
          const isWrong = wrong.includes(o.id) && !isCorrect;
          const selected = choice === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={finished || isWrong || submitting}
              onClick={() => setChoice(o.id)}
              className={cx(
                "flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-body text-sm transition",
                playerFocus,
                isCorrect && "border-[#1FA97A] bg-[#1FA97A]/15 text-mist",
                isWrong &&
                  "border-[#E8735C]/50 bg-[#E8735C]/10 text-sky/60 line-through",
                !isCorrect &&
                  !isWrong &&
                  selected &&
                  "border-ocean bg-ocean/15 text-mist",
                !isCorrect &&
                  !isWrong &&
                  !selected &&
                  "border-white/10 text-sky hover:border-white/25",
              )}
            >
              <span className="flex-1">{o.text}</span>
              {isCorrect && (
                <Check
                  size={18}
                  className="text-[#1FA97A]"
                  aria-label={copy.puzzle.rightAnswer}
                />
              )}
              {isWrong && (
                <X size={18} className="text-[#E8735C]" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="font-body text-sm text-[#E8735C]">{error}</p>}

      {result?.status === "PASSED" && <RewardCard rewards={result.rewards} />}
      {result?.status === "IN_PROGRESS" && (
        <p
          role="status"
          className="font-body text-sm font-semibold text-[#E0A72F]"
        >
          {copy.puzzle.tryAgain}
        </p>
      )}
      {result?.status === "NOT_YET" && (
        <p
          role="status"
          className="font-body text-sm font-semibold text-[#E8735C]"
        >
          {copy.puzzle.notYet}
        </p>
      )}

      {finished && explanation && (
        <div className="rounded-xl bg-white/[0.04] px-4 py-3">
          <p className="font-body text-xs font-semibold text-sky/70">
            {copy.puzzle.why}
          </p>
          <p className="mt-1 font-body text-sm leading-relaxed text-mist">
            {explanation}
          </p>
        </div>
      )}

      {finished ? (
        <button
          type="button"
          onClick={onFinished}
          className={cx(bigButton, "w-full bg-ocean text-white")}
        >
          {copy.puzzle.continue}
        </button>
      ) : (
        <button
          type="button"
          onClick={check}
          disabled={!choice || submitting}
          className={cx(bigButton, "w-full bg-ocean text-white")}
        >
          {submitting
            ? copy.puzzle.checking
            : choice
              ? copy.puzzle.check
              : copy.puzzle.choose}
        </button>
      )}
    </div>
  );
}
