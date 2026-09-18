"use client";
import { useEffect, useState } from "react";

export function TodaysPuzzle() {
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/puzzles/today")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  async function handleAnswer(optionId: string) {
    if (selected) return;
    setSelected(optionId);
    const res = await fetch("/api/puzzles/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzleId: data.puzzle._id,
        selectedOptionId: optionId,
      }),
    });
    setResult(await res.json());
  }

  if (loading) return null;

  if (!data?.puzzle) {
    return (
      <div className="mx-6 mt-6 rounded-2xl border border-sky/10 bg-white/[0.03] p-5 text-center">
        <p className="text-3xl">🧩</p>
        <p className="mt-2 font-body text-sm text-sky/60">
          No puzzle today — check back tomorrow!
        </p>
      </div>
    );
  }

  if (data.solved) {
    return (
      <div className="mx-6 mt-6 rounded-2xl border border-[#1FA97A]/30 bg-[#1FA97A]/10 p-5 text-center">
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-display text-lg font-bold text-mist">Solved!</p>
        <p className="font-body text-sm text-sky/70">
          {data.wasCorrect
            ? `+${data.awardedXp} XP earned`
            : "Nice try — new puzzle coming soon"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-6 mt-6 rounded-2xl border border-ocean/30 bg-gradient-to-br from-ocean/10 to-transparent p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        🧩 Today's Puzzle
      </p>
      <h2 className="mt-2 font-display text-xl font-bold text-mist">
        {data.puzzle.title}
      </h2>
      {data.puzzle.diagramUrl && (
        <img src={data.puzzle.diagramUrl} alt="" className="mt-3 rounded-lg" />
      )}
      <p className="mt-2 font-body text-sm text-mist">{data.puzzle.question}</p>

      <div className="mt-4 space-y-2">
        {data.puzzle.options.map((opt: any) => {
          const isSelected = selected === opt.id;
          const isCorrectAnswer = result && opt.id === result.correctOptionId;
          const showFeedback = result !== null;

          let style = "border-sky/20 text-mist hover:border-ocean";
          if (showFeedback) {
            if (isCorrectAnswer)
              style = "border-[#1FA97A] bg-[#1FA97A]/15 text-mist";
            else if (isSelected)
              style = "border-red-400 bg-red-400/10 text-mist";
            else style = "border-sky/10 text-sky/40";
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt.id)}
              disabled={!!selected}
              className={`w-full rounded-xl border-2 p-3 text-left font-body text-sm transition ${style}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {result && (
        <div className="mt-4 rounded-lg bg-white/5 p-3">
          <p className="font-body text-sm font-medium text-mist">
            {result.isCorrect
              ? `🎉 Correct! +${result.awardedXp} XP`
              : "Not quite — here's why:"}
          </p>
          <p className="mt-1 font-body text-xs text-sky/70">
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
