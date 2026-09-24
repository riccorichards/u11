"use client";
import { useEffect, useState } from "react";

export function PuzzleArchive() {
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/puzzles/mine")
      .then((r) => r.json())
      .then(setPuzzles);
  }, []);

  async function handleAnswer(puzzleId: string, optionId: string) {
    const res = await fetch("/api/puzzles/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId, selectedOptionId: optionId }),
    });
    const data = await res.json();
    setPuzzles(
      puzzles.map((p) =>
        p._id === puzzleId
          ? {
              ...p,
              solved: true,
              isCorrect: data.isCorrect,
              correctOptionId: data.correctOptionId,
              explanation: data.explanation,
            }
          : p,
      ),
    );
  }

  return (
    <div className="space-y-2">
      {puzzles.map((p) => (
        <div
          key={p._id}
          className="rounded-2xl border border-sky/10 bg-white/[0.03] p-4"
        >
          <button
            onClick={() => setOpenId(openId === p._id ? null : p._id)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-body text-sm text-mist">{p.title}</span>
            <span className="font-body text-xs">
              {p.solved ? (
                p.isCorrect ? (
                  "✅"
                ) : (
                  "❌"
                )
              ) : (
                <span className="text-ocean">{p.xpReward} XP</span>
              )}
            </span>
          </button>
          {openId === p._id && (
            <div className="mt-3 space-y-2">
              <p className="font-body text-sm text-sky/80">{p.question}</p>
              {p.options.map((opt: any) => {
                const showFeedback = p.solved;
                let style = "border-sky/20 text-mist";
                if (showFeedback) {
                  style =
                    opt.id === p.correctOptionId
                      ? "border-[#1FA97A] bg-[#1FA97A]/15 text-mist"
                      : "border-sky/10 text-sky/40";
                }
                return (
                  <button
                    key={opt.id}
                    disabled={p.solved}
                    onClick={() => handleAnswer(p._id, opt.id)}
                    className={`w-full rounded-lg border-2 p-2.5 text-left font-body text-sm transition ${style}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
              {p.solved && (
                <p className="font-body text-xs text-sky/60">{p.explanation}</p>
              )}
            </div>
          )}
        </div>
      ))}
      {puzzles.length === 0 && (
        <p className="font-body text-sm text-sky/50">No puzzles yet.</p>
      )}
    </div>
  );
}
