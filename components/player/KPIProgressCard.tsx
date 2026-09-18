const LABELS: Record<string, string> = {
  prsAvg: "Session Readiness",
  avgRating: "Match Rating",
  attendanceRate: "Attendance",
  consistencyScore: "Consistency",
  disciplineScore: "Discipline",
  pillarOverall: "Overall Growth",
};

export function KPIProgressCard({ kpiProgress }: { kpiProgress: any }) {
  if (!kpiProgress || !kpiProgress.progress?.length) {
    return (
      <div className="rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
        <p className="font-body text-xs uppercase tracking-wide text-sky">
          🎯 My Targets
        </p>
        <p className="mt-2 font-body text-sm text-sky/50">
          Your coach hasn't set targets yet — check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        🎯 My Targets
      </p>
      <div className="mt-3 space-y-3">
        {kpiProgress.progress.map((p: any) => (
          <div key={p.metric}>
            <div className="flex justify-between font-body text-xs text-sky/70">
              <span>{LABELS[p.metric] ?? p.metric}</span>
              <span className="text-mist">
                {p.current} / {p.target}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-ocean transition-all"
                style={{ width: `${Math.min(100, p.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
