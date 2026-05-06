"use client";
import { PlayerWeekSummary } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Star,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { getPlayerImage } from "@/lib/playerImages";
import Link from "next/link";

interface Props {
  summaries: PlayerWeekSummary[];
}

const READINESS_CONFIG = {
  match_ready: {
    label: "Match Ready",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    dot: "bg-green-400",
  },
  monitor: {
    label: "Monitor",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-400",
  },
  rest: {
    label: "Rest",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
  },
};

// ─── Sparkline ─────────────────────────────────────────────────────────────────

function MiniSparkline({ values }: { values: number[] }) {
  const w = 48;
  const h = 20;

  // Single session: render a centred dot so the layout doesn't collapse
  if (values.length === 1) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <circle cx={w / 2} cy={h / 2} r="2.5" fill="#97CADB" opacity={0.5} />
      </svg>
    );
  }

  const max = Math.max(...values, 0.1);
  const min = Math.min(...values);
  const range = max - min || 0.1;

  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2; // 2px padding top/bottom
      return `${x},${y}`;
    })
    .join(" ");

  const trend = values[values.length - 1] - values[0];
  const stroke =
    trend > 0.01 ? "#4ade80" : trend < -0.01 ? "#f87171" : "#97CADB";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={(i / (values.length - 1)) * w}
          cy={h - ((v - min) / range) * (h - 4) - 2}
          r="2"
          fill={stroke}
        />
      ))}
    </svg>
  );
}

// ─── Attendance pips ────────────────────────────────────────────────────────────

function AttendancePips({
  attended,
  total,
}: {
  attended: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i < attended ? "bg-sky/60" : "bg-sky/15"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Trend badge ────────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: number }) {
  const pct = Math.round(trend * 100);
  if (Math.abs(pct) < 1) return <Minus size={12} className="text-sky/40" />;
  if (trend > 0)
    return (
      <span className="flex items-center gap-0.5 text-green-400 text-xs font-mono">
        <TrendingUp size={11} />+{pct}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-mono">
      <TrendingDown size={11} />
      {pct}%
    </span>
  );
}

// ─── Main widget ────────────────────────────────────────────────────────────────

export default function Top5Widget({ summaries }: Props) {
  if (!summaries.length) {
    return (
      <div className="glass rounded-2xl p-5 h-full flex flex-col items-center justify-center gap-2">
        <Star size={28} className="text-sky/20" />
        <p className="text-sky/40 text-sm font-body text-center">
          No training sessions yet.
          <br />
          Log a session to see weekly rankings.
        </p>
      </div>
    );
  }

  // Eligible players: met the 75% attendance gate, ordered by attendance-weighted score
  const eligible = [...summaries]
    .filter((s) => s.meetsThreshold)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 5);

  // Ineligible players: below the attendance gate, ordered by how close they are
  const ineligible = [...summaries]
    .filter((s) => !s.meetsThreshold)
    .sort((a, b) => b.sessionCount - a.sessionCount);

  // Most improved: highest positive trend among eligible players not in top 2.
  // Excluding top 2 keeps the badge meaningful — it's not just another #1 reward.
  const mostImproved =
    eligible.length > 2
      ? ([...eligible]
          .slice(2)
          .filter((s) => s.trend > 0)
          .sort((a, b) => b.trend - a.trend)[0] ?? null)
      : null;

  // Pull shared metadata from first summary (same for all players this week)
  const totalSessions = summaries[0]?.totalSessionsThisWeek ?? 0;
  const rankThreshold = summaries[0]?.rankThreshold ?? 0;
  const sessionsNeeded = rankThreshold;

  return (
    <div className="glass rounded-2xl p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
            Week&apos;s Best
          </h3>
          <p className="text-xs text-sky/40 font-body mt-0.5">
            Top players by readiness · {totalSessions} session
            {totalSessions !== 1 ? "s" : ""} this week
          </p>
        </div>
        <div className="glass rounded-xl px-2.5 py-1 flex items-center gap-1.5">
          <Star size={11} className="text-yellow-400" />
          <span className="text-xs font-mono text-sky/60">Last 7 days</span>
        </div>
      </div>

      {/* No eligible players yet */}
      {eligible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Lock size={20} className="text-sky/20" />
          <p className="text-sky/40 text-sm font-body text-center">
            No player has reached {sessionsNeeded} session
            {sessionsNeeded !== 1 ? "s" : ""} yet.
            <br />
            Rankings unlock at 75% attendance.
          </p>
        </div>
      )}

      {/* Ranked list */}
      {eligible.length > 0 && (
        <div className="space-y-2 mb-3">
          {eligible.map((summary, i) => {
            const cfg = READINESS_CONFIG[summary.readinessLabel];
            const isTopPlayer = i === 0;
            const isMostImproved =
              mostImproved?.player._id === summary.player._id;

            return (
              <Link
                href={`/players/${summary.player._id}`}
                key={summary.player._id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  isTopPlayer
                    ? "glass-bright border border-ocean/20"
                    : "glass hover:glass-bright"
                }`}
              >
                {/* Rank */}
                <div className="w-5 text-center flex-shrink-0">
                  {isTopPlayer ? (
                    <Star size={14} className="text-yellow-400 mx-auto" />
                  ) : (
                    <span className="text-sky/30 font-mono text-xs">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-navy-800/60 flex-shrink-0 border border-sky/10">
                  <Image
                    src={getPlayerImage(summary.player.avatarKey)}
                    alt={summary.player.name}
                    fill
                    sizes="32px"
                    className="object-cover object-top"
                    quality={90}
                  />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-display font-bold text-sm truncate">
                      {summary.player.name} {summary.player.surname}
                    </span>

                    {summary.injuryFlagged && (
                      <AlertTriangle
                        size={11}
                        className="text-red-400 flex-shrink-0"
                      />
                    )}

                    {isMostImproved && (
                      <span className="text-[9px] font-mono bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 flex-shrink-0">
                        ↑ IMPROVED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className={`text-[9px] px-1 rounded font-mono pos-${summary.player.position}`}
                    >
                      {summary.player.position}
                    </span>
                    <span className="text-[10px] text-sky/40 font-body">
                      Best: {summary.bestMetric}
                    </span>
                    {/* Attendance pips + fraction */}
                    <div className="flex items-center gap-1">
                      <AttendancePips
                        attended={summary.sessionCount}
                        total={totalSessions}
                      />
                      <span className="text-[10px] text-sky/30 font-mono">
                        {summary.sessionCount}/{totalSessions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="hidden md:block flex-shrink-0">
                  <MiniSparkline values={summary.prsHistory} />
                </div>

                {/* Score + trend */}
                <div className="flex-shrink-0 text-right">
                  <div className="font-display font-black text-lg text-white">
                    {Math.round(summary.avgPRS * 100)}
                  </div>
                  <div className="flex items-center justify-end">
                    <TrendBadge trend={summary.trend} />
                  </div>
                </div>

                {/* Readiness dot */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${cfg.dot}`}
                    title={cfg.label}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Below-threshold players */}
      {ineligible.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-sky/10" />
            <span className="text-[10px] font-mono text-sky/30 flex items-center gap-1">
              <Lock size={9} />
              needs {sessionsNeeded}+ sessions to rank
            </span>
            <div className="flex-1 h-px bg-sky/10" />
          </div>

          <div className="space-y-1.5">
            {ineligible.map((summary) => {
              const remaining = sessionsNeeded - summary.sessionCount;
              return (
                <Link
                  href={`/players/${summary.player._id}`}
                  key={summary.player._id}
                  className="flex items-center gap-3 px-2.5 py-2 rounded-xl opacity-50 hover:opacity-70 transition-opacity"
                >
                  {/* Avatar — greyed with blend */}
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-navy-800/60 flex-shrink-0 border border-sky/10 grayscale">
                    <Image
                      src={getPlayerImage(summary.player.avatarKey)}
                      alt={summary.player.name}
                      fill
                      sizes="28px"
                      className="object-cover object-top"
                      quality={80}
                    />
                  </div>

                  {/* Name + gap */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sky/60 font-display font-bold text-xs truncate block">
                      {summary.player.name} {summary.player.surname}
                    </span>
                    <span className="text-[10px] text-sky/30 font-body">
                      {remaining} more session{remaining !== 1 ? "s" : ""} to
                      unlock ranking
                    </span>
                  </div>

                  {/* Attendance pips */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <AttendancePips
                      attended={summary.sessionCount}
                      total={totalSessions}
                    />
                    <span className="text-[10px] text-sky/30 font-mono">
                      {summary.sessionCount}/{totalSessions}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="pt-3 mt-3 border-t border-sky/10 flex items-center gap-4 flex-wrap">
        {Object.entries(READINESS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] font-mono text-sky/40">
              {cfg.label}
            </span>
          </div>
        ))}
        <span className="ml-auto text-[10px] font-mono text-sky/30">
          Score = PRS × 100 · Rank = attendance-adjusted
        </span>
      </div>
    </div>
  );
}
