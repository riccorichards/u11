"use client";
import { useState } from "react";

const RESULT_COLOR: Record<string, string> = {
  W: "#1FA97A",
  D: "#E0A72F",
  L: "#E8735C",
};

const RESULT_LABEL: Record<string, string> = {
  W: "მ",
  D: "ფ",
  L: "წ",
};

const CMR_FIELDS = [
  { key: "defensiveContrib", label: "დაცვა" },
  { key: "technicalExec", label: "ტექნიკა" },
  { key: "tacticalDiscipline", label: "ტაქტიკა" },
  { key: "attackingContrib", label: "შეტევა" },
  { key: "mentalPerformance", label: "მენტალური" },
] as const;

export function MatchHistoryList({ matches }: { matches: any[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const ordered = matches.slice().reverse();

  return (
    <div className="rounded-2xl border border-sky/10 bg-white/[0.02] p-4">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        ⚽ მატჩების ისტორია
      </p>
      <div className="mt-3 space-y-1.5">
        {ordered.map((m) => {
          const isOpen = openId === m.matchId;
          return (
            <div key={m.matchId} className="rounded-lg bg-white/[0.03]">
              <button
                onClick={() => setOpenId(isOpen ? null : m.matchId)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
              >
                <div>
                  <p className="font-body text-sm text-mist">vs {m.opponent}</p>
                  <p className="font-body text-xs text-sky/60">
                    {m.date} · {m.minutesPlayed}' წუთი
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.isMvp && <span className="text-sm">⭐</span>}
                  <span className="font-mono text-sm text-mist">
                    {(m.officialRating ?? m.rating).toFixed(1)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 font-body text-xs font-medium text-white"
                    style={{ backgroundColor: RESULT_COLOR[m.result] }}
                  >
                    {RESULT_LABEL[m.result] ?? m.result}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-sky/10 px-3 py-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-display text-lg font-bold text-mist">
                        {m.goals}
                      </p>
                      <p className="font-body text-[10px] text-sky/60">გოლი</p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-mist">
                        {m.assists}
                      </p>
                      <p className="font-body text-[10px] text-sky/60">
                        ასისტი
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-mist">
                        {m.rating.toFixed(1)}
                      </p>
                      <p className="font-body text-[10px] text-sky/60">
                        მწვრთნელის შეფასება
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {CMR_FIELDS.map((f) => {
                      const val = m.cmrCriteria?.[f.key];
                      if (val == null) return null;
                      return (
                        <div key={f.key} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 font-body text-xs text-sky/60">
                            {f.label}
                          </span>
                          <div className="h-1.5 flex-1 rounded-full bg-white/10">
                            <div
                              className="h-1.5 rounded-full bg-ocean"
                              style={{ width: `${(val / 10) * 100}%` }}
                            />
                          </div>
                          <span className="w-6 text-right font-mono text-xs text-mist">
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 font-body text-xs text-sky/60">
                    {m.yellowCard && <span>🟨 ყვითელი ბარათი</span>}
                    {m.redCard && <span>🟥 წითელი ბარათი</span>}
                    {m.osi != null && (
                      <span>მეტოქის სიძლიერე: {m.osi.toFixed(1)}/10</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {matches.length === 0 && (
          <p className="font-body text-sm text-sky/50">
            მატჩები ჯერ არ ჩატარებულა.
          </p>
        )}
      </div>
    </div>
  );
}
