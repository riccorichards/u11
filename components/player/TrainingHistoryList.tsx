"use client";
import { useState } from "react";

const READINESS_COLOR: Record<string, string> = {
  match_ready: "#1FA97A",
  monitor: "#E0A72F",
  rest: "#E8735C",
};

const METRIC_FIELDS = [
  { key: "workRate", label: "Work Rate" },
  { key: "technicalQuality", label: "Technical" },
  { key: "tacticalAwareness", label: "Tactical" },
  { key: "focusLevel", label: "Focus" },
  { key: "bodyLanguage", label: "Body Language" },
  { key: "coachability", label: "Coachability" },
] as const;

export function TrainingHistoryList({ sessions }: { sessions: any[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const ordered = sessions.slice().reverse();

  return (
    <div className="rounded-2xl border border-sky/10 bg-white/[0.02] p-4">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        🏃 Training Log
      </p>
      <div className="mt-3 space-y-1.5">
        {ordered.map((s) => {
          const isOpen = openId === s.sessionId;
          return (
            <div key={s.sessionId} className="rounded-lg bg-white/[0.03]">
              <button
                onClick={() => setOpenId(isOpen ? null : s.sessionId)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
              >
                <div>
                  <p className="font-body text-sm capitalize text-mist">
                    {s.sessionType}
                  </p>
                  <p className="font-body text-xs text-sky/60">
                    {s.date} · {s.minutesParticipated}' · {s.emotionalState}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.injuryFlag && <span className="text-sm">🩹</span>}
                  <span className="font-mono text-sm text-mist">
                    {Math.round(s.prs * 100)}%
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 font-body text-xs font-medium text-white"
                    style={{
                      backgroundColor: READINESS_COLOR[s.readinessLabel],
                    }}
                  >
                    {s.readinessLabel.replace("_", " ")}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-sky/10 px-3 py-3">
                  <div className="space-y-1.5">
                    {METRIC_FIELDS.map((f) => (
                      <div key={f.key} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 font-body text-xs text-sky/60">
                          {f.label}
                        </span>
                        <div className="h-1.5 flex-1 rounded-full bg-white/10">
                          <div
                            className="h-1.5 rounded-full bg-ocean"
                            style={{ width: `${(s[f.key] / 10) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-xs text-mist">
                          {s[f.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 font-body text-xs text-sky/60">
                    <span>Fatigue: {s.fatigueLevel}/10</span>
                    {s.injuryFlag && (
                      <span className="text-red-400">
                        Injury flagged this session
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sessions.length === 0 && (
          <p className="font-body text-sm text-sky/50">
            No training sessions logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
