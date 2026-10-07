export function ReadOnlyPuzzleList({ puzzles }: { puzzles: any[] }) {
  const solved = puzzles.filter((p) => p.solved);
  const correct = solved.filter((p) => p.isCorrect);

  return (
    <div className="rounded-2xl border border-sky/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs uppercase tracking-wide text-sky">
          🧩 თავსატეხები
        </p>
        <span className="font-mono text-xs text-sky/60">
          {correct.length} სწორი / {solved.length} ნაცადი / {puzzles.length} სულ
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {puzzles.map((p) => (
          <div
            key={p._id}
            className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
          >
            <span className="font-body text-sm text-mist">{p.title}</span>
            <span className="font-body text-xs">
              {!p.solved ? (
                <span className="text-sky/40">არ არის ნაცადი</span>
              ) : p.isCorrect ? (
                <span className="text-[#1FA97A]">✓ სწორია</span>
              ) : (
                <span className="text-red-400">✗ არასწორია</span>
              )}
            </span>
          </div>
        ))}
        {puzzles.length === 0 && (
          <p className="font-body text-sm text-sky/50">
            თავსატეხები ჯერ შექმნილი არ არის.
          </p>
        )}
      </div>
    </div>
  );
}
