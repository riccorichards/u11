"use client";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PillarScores } from "@/types";
import { BarChart2, AlertCircle } from "lucide-react";

interface Props {
  pillarScores: PillarScores;
  assessmentCount: number;
  position: string;
}

const PILLAR_BENCHMARKS: Record<
  string,
  Omit<PillarScores, "overall" | "weeklySnapshots">
> = {
  GK: { physical: 6.5, technical: 6.0, tactical: 7.5, mental: 7.5 },
  DEF: { physical: 7.0, technical: 6.5, tactical: 7.5, mental: 7.0 },
  MID: { physical: 7.0, technical: 7.5, tactical: 7.0, mental: 7.0 },
  FWD: { physical: 7.5, technical: 8.0, tactical: 6.5, mental: 7.0 },
};

const PILLAR_LABELS: Record<string, string> = {
  Physical: "ფიზიკური",
  Technical: "ტექნიკური",
  Tactical: "ტაქტიკური",
  Mental: "მენტალური",
};

const PILLAR_COLORS: Record<string, string> = {
  Physical: "#f87171",
  Technical: "#a78bfa",
  Tactical: "#818cf8",
  Mental: "#4ade80",
};

const PILLAR_DESCS: Record<string, string> = {
  Physical: "სისწრაფე, გამძლეობა, ძალა, მოქნილობა",
  Technical: "პირველი შეხება, პასი, დარტყმა, დრიბლინგი",
  Tactical: "პოზიციონირება, პრესინგი, გადაწყვეტილება",
  Mental: "სიმშვიდე, ლიდერობა, ხასიათი, სწავლის უნარი",
};

const BOOTSTRAP_THRESHOLD = 2;

export default function PillarRadar({
  pillarScores,
  assessmentCount,
  position,
}: Props) {
  const benchmark = PILLAR_BENCHMARKS[position] ?? PILLAR_BENCHMARKS.MID;
  const inBootstrap = assessmentCount < BOOTSTRAP_THRESHOLD;

  const chartData = [
    {
      metric: PILLAR_LABELS.Physical,
      rawKey: "Physical",
      player: pillarScores.physical,
      benchmark: benchmark.physical,
    },
    {
      metric: PILLAR_LABELS.Technical,
      rawKey: "Technical",
      player: pillarScores.technical,
      benchmark: benchmark.technical,
    },
    {
      metric: PILLAR_LABELS.Tactical,
      rawKey: "Tactical",
      player: pillarScores.tactical,
      benchmark: benchmark.tactical,
    },
    {
      metric: PILLAR_LABELS.Mental,
      rawKey: "Mental",
      player: pillarScores.mental,
      benchmark: benchmark.mental,
    },
  ];

  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <BarChart2 size={15} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
              მოთამაშის პროფილი
            </h3>
            <p className="text-xs text-sky/40 font-body mt-0.5">
              4 მთავარი საყრდენი · {position} ეტალონი
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-black text-purple-400">
            {pillarScores.overall.toFixed(1)}
          </div>
          <div className="text-[10px] font-mono text-sky/40 uppercase">
            საერთო
          </div>
        </div>
      </div>

      {/* Bootstrap warning */}
      {inBootstrap && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2 glass rounded-xl border border-ocean/20">
          <span className="text-sm">🌱</span>
          <p className="text-[10px] font-mono text-sky/70">
            სრული სურათი ჯერ კიდევ ფორმირდება — კიდევ{" "}
            {BOOTSTRAP_THRESHOLD - assessmentCount} თვიური შემოწმება და ეს
            დიაგრამა უფრო ზუსტი გახდება!
          </p>
        </div>
      )}

      {assessmentCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center">
            <BarChart2 size={22} className="text-sky/20" />
          </div>
          <div className="text-center">
            <p className="text-white font-display font-bold text-sm">
              შეფასებები ჯერ არ არის
            </p>
            <p className="text-sky/40 text-xs font-body mt-1">
              შეფასებები შეიყვანება ყოველკვირეულად მწვრთნელის მიერ
            </p>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="rgba(151,202,219,0.1)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{
                  fill: "rgba(151,202,219,0.7)",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                }}
              />
              <Radar
                name={`${position} ეტალონი`}
                dataKey="benchmark"
                stroke="rgba(151,202,219,0.3)"
                fill="rgba(151,202,219,0.05)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Radar
                name="მოთამაშე"
                dataKey="player"
                stroke="#a78bfa"
                fill="rgba(167,139,250,0.15)"
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,27,72,0.95)",
                  border: "1px solid rgba(151,202,219,0.2)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontFamily: "JetBrains Mono",
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}/10`,
                  name,
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Pillar breakdown */}
          <div className="space-y-2.5 mt-2">
            {chartData.map(({ metric, rawKey, player, benchmark: bench }) => {
              const diff = player - bench;
              const color = PILLAR_COLORS[rawKey];
              return (
                <div key={metric} className="flex items-center gap-3">
                  <div className="w-20 flex-shrink-0">
                    <div className="text-[10px] font-mono text-sky/60 uppercase">
                      {metric}
                    </div>
                    <div className="text-[8px] font-body text-sky/30 leading-tight mt-0.5">
                      {PILLAR_DESCS[rawKey]}
                    </div>
                  </div>
                  <div className="flex-1 h-1.5 bg-navy-800/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(player / 10) * 100}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white w-7 text-right">
                    {player.toFixed(1)}
                  </span>
                  <span
                    className={`text-[10px] font-mono w-10 text-right ${
                      diff >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-sky/10">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-purple-400" />
              <span className="text-[10px] font-mono text-sky/40">
                მოთამაშე
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-0.5"
                style={{ borderTop: "1px dashed rgba(151,202,219,0.3)" }}
              />
              <span className="text-[10px] font-mono text-sky/40">
                {position} ეტალონი
              </span>
            </div>
            <span className="ml-auto text-[10px] font-mono text-sky/30">
              {assessmentCount} კვირის მონაცემი
            </span>
          </div>
        </>
      )}
    </div>
  );
}
