"use client";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarData {
  [key: string]: number;
  workRate: number;
  technicalQuality: number;
  tacticalAwareness: number;
  focusLevel: number;
  bodyLanguage: number;
  coachability: number;
}

interface Props {
  radarData: RadarData | null;
  position: string;
}

const POS_BENCHMARKS: Record<string, RadarData> = {
  GK: {
    workRate: 9.5,
    technicalQuality: 8.5,
    tacticalAwareness: 9.0,
    focusLevel: 9.0,
    bodyLanguage: 10.0,
    coachability: 10.0,
  },
  DEF: {
    workRate: 9.5,
    technicalQuality: 8.5,
    tacticalAwareness: 9.0,
    focusLevel: 9.0,
    bodyLanguage: 10.0,
    coachability: 10.0,
  },
  MID: {
    workRate: 7.5,
    technicalQuality: 7.5,
    tacticalAwareness: 7.0,
    focusLevel: 9.0,
    bodyLanguage: 10.0,
    coachability: 10.0,
  },
  FWD: {
    workRate: 7.5,
    technicalQuality: 8.0,
    tacticalAwareness: 6.5,
    focusLevel: 9.0,
    bodyLanguage: 10.0,
    coachability: 10.0,
  },
};

const METRIC_LABELS: Record<string, string> = {
  workRate: "შრომისმოყვარეობა",
  technicalQuality: "ტექნიკა",
  tacticalAwareness: "ტაქტიკა",
  focusLevel: "კონცენტრაცია",
  bodyLanguage: "სხეულის ენა",
  coachability: "სწავლის უნარი",
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  workRate: "მონდომება და სირბილის ინტენსივობა ვარჯიშზე",
  technicalQuality: "ბურთის კონტროლი, პასი და დარტყმის შესრულება",
  tacticalAwareness: "პოზიციური შერჩევა, პრესინგი და განლაგება",
  focusLevel: "ყურადღება და მწვრთნელის დავალებების მოსმენა",
  bodyLanguage: "პოზიტიური განწყობა და ლიდერული ჟესტები",
  coachability: "შენიშვნების გათვალისწინება და სწრაფი გამოსწორება",
};

export default function PlayerRadarChart({ radarData, position }: Props) {
  const benchmark = POS_BENCHMARKS[position] ?? POS_BENCHMARKS.MID;

  if (!radarData) {
    return (
      <div className="glass rounded-2xl p-5 h-full flex flex-col items-center justify-center gap-2">
        <p className="text-sky/40 text-sm font-body text-center">
          ვარჯიშები ჯერ არ არის აღრიცხული.
          <br />
          რადარი პირველივე ვარჯიშის შემდეგ გამოჩნდება.
        </p>
      </div>
    );
  }

  const chartData = Object.keys(radarData).map((key) => ({
    metric: METRIC_LABELS[key],
    player: radarData[key],
    benchmark: benchmark[key],
    fullMark: 10,
  }));

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
          უნარების რადარი
        </h3>
        <p className="text-xs text-sky/40 font-body mt-0.5">
          სეზონის საშუალო vs {position} პოზიციის ეტალონი
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(151,202,219,0.1)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{
              fill: "rgba(151,202,219,0.6)",
              fontSize: 10,
              fontFamily: "JetBrains Mono",
            }}
          />
          <Radar
            name="პოზიციის საშუალო"
            dataKey="benchmark"
            stroke="rgba(151,202,219,0.3)"
            fill="rgba(151,202,219,0.05)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Radar
            name="შენი ქულა"
            dataKey="player"
            stroke="#018ABE"
            fill="rgba(1,138,190,0.2)"
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
            formatter={(value: number, name: string) => [`${value}/10`, name]}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Metric breakdown with descriptions */}
      <div className="space-y-3 mt-4">
        {Object.keys(radarData).map((key) => {
          const val = radarData[key];
          const bench = benchmark[key];
          const diff = val - bench;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-32 flex-shrink-0">
                <div className="text-[10px] font-mono text-sky/60 uppercase">
                  {METRIC_LABELS[key]}
                </div>
                <div className="text-[9px] font-body text-sky/30 leading-tight mt-0.5">
                  {METRIC_DESCRIPTIONS[key]}
                </div>
              </div>
              <div className="flex-1 h-1.5 bg-navy-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(val / 10) * 100}%`,
                    background: diff >= 0 ? "#018ABE" : "#f87171",
                  }}
                />
              </div>
              <span className="text-xs font-mono text-white w-6 text-right">
                {val}
              </span>
              <span
                className={`text-[10px] font-mono w-10 text-right ${diff >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {diff >= 0 ? "+" : ""}
                {diff.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-sky/10">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-ocean" />
          <span className="text-[10px] font-mono text-sky/40">შენი ქულა</span>
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
      </div>
    </div>
  );
}
