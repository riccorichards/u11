const STATUS_COLOR: Record<string, string> = {
  active: "#018ABE",
  completed: "#1FA97A",
  failed: "#E8735C",
  expired: "#97CADB",
};

export function ChallengeCard({ challenge }: { challenge: any }) {
  const daysLeft = Math.ceil(
    (new Date(challenge.deadline).getTime() - Date.now()) / 86400000,
  );
  const pct = Math.min(
    100,
    (challenge.progressCount / challenge.targetCount) * 100,
  );

  return (
    <div className="rounded-2xl border border-sky/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm font-medium text-mist">
          {challenge.title}
        </p>
        <span
          className="rounded-full px-2 py-0.5 font-body text-xs font-medium text-white"
          style={{ backgroundColor: STATUS_COLOR[challenge.status] }}
        >
          {challenge.status}
        </span>
      </div>
      {challenge.description && (
        <p className="mt-1 font-body text-xs text-sky/60">
          {challenge.description}
        </p>
      )}
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-ocean transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-body text-xs text-sky/60">
        <span>
          {challenge.progressCount}/{challenge.targetCount}
        </span>
        <span>{challenge.status === "active" ? `${daysLeft}d left` : ""}</span>
        <span className="text-ocean">{challenge.xpReward} XP</span>
      </div>
    </div>
  );
}
