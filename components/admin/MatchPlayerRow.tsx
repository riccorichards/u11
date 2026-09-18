"use client";
import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { RatingSlider } from "./RatingSlider";

const CMR_FIELDS = [
  { key: "defensiveContrib", label: "Defensive Contribution" },
  { key: "technicalExec", label: "Technical Execution" },
  { key: "tacticalDiscipline", label: "Tactical Discipline" },
  { key: "attackingContrib", label: "Attacking Contribution" },
  { key: "mentalPerformance", label: "Mental Performance" },
] as const;

export type MatchPerformance = {
  minutesPlayed: number;
  goals: number;
  assists: number;
  rating: number;
  isMvp: boolean;
  yellowCard: boolean;
  redCard: boolean;
  defensiveContrib: number;
  technicalExec: number;
  tacticalDiscipline: number;
  attackingContrib: number;
  mentalPerformance: number;
};

export function MatchPlayerRow({
  player,
  played,
  onTogglePlayed,
  perf,
  onPerfChange,
}: {
  player: {
    _id: string;
    name: string;
    surname: string;
    number: number;
    avatarUrl?: string | null;
  };
  played: boolean;
  onTogglePlayed: () => void;
  perf: MatchPerformance;
  onPerfChange: (p: MatchPerformance) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border ${played ? "border-sky/10" : "border-sky/5"} bg-white/[0.02]`}
    >
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => played && setExpanded(!expanded)}
          disabled={!played}
          className={`flex flex-1 items-center gap-3 text-left ${!played ? "opacity-40" : ""}`}
        >
          <PlayerAvatar
            name={player.name}
            surname={player.surname}
            avatarUrl={player.avatarUrl}
            size={36}
          />
          <div>
            <p className="font-body text-sm font-medium text-mist">
              {player.name} {player.surname}
            </p>
            <p className="font-body text-xs text-sky/60">
              #{player.number}
              {played &&
                !expanded &&
                ` · ${perf.minutesPlayed}' · Rating ${perf.rating}`}
            </p>
          </div>
        </button>
        <button
          onClick={onTogglePlayed}
          className={`rounded-md px-3 py-1.5 font-body text-xs font-medium transition ${
            played
              ? "bg-[#1FA97A]/20 text-[#1FA97A]"
              : "border border-sky/20 text-sky/50"
          }`}
        >
          {played ? "Played" : "Did not play"}
        </button>
      </div>

      {played && expanded && (
        <div className="space-y-4 border-t border-sky/10 p-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="font-body text-xs text-sky">Minutes</label>
              <input
                type="number"
                value={perf.minutesPlayed}
                onChange={(e) =>
                  onPerfChange({
                    ...perf,
                    minutesPlayed: Number(e.target.value),
                  })
                }
                className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-1 font-body text-sm text-mist outline-none focus:border-ocean"
              />
            </div>
            <div>
              <label className="font-body text-xs text-sky">Goals</label>
              <input
                type="number"
                value={perf.goals}
                onChange={(e) =>
                  onPerfChange({ ...perf, goals: Number(e.target.value) })
                }
                className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-1 font-body text-sm text-mist outline-none focus:border-ocean"
              />
            </div>
            <div>
              <label className="font-body text-xs text-sky">Assists</label>
              <input
                type="number"
                value={perf.assists}
                onChange={(e) =>
                  onPerfChange({ ...perf, assists: Number(e.target.value) })
                }
                className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-1 font-body text-sm text-mist outline-none focus:border-ocean"
              />
            </div>
            <RatingSlider
              label="Coach Rating"
              value={perf.rating}
              onChange={(v) => onPerfChange({ ...perf, rating: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {CMR_FIELDS.map((f) => (
              <RatingSlider
                key={f.key}
                label={f.label}
                value={perf[f.key]}
                onChange={(v) => onPerfChange({ ...perf, [f.key]: v })}
              />
            ))}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 font-body text-xs text-sky">
              <input
                type="checkbox"
                checked={perf.isMvp}
                onChange={(e) =>
                  onPerfChange({ ...perf, isMvp: e.target.checked })
                }
              />
              MVP
            </label>
            <label className="flex items-center gap-2 font-body text-xs text-sky">
              <input
                type="checkbox"
                checked={perf.yellowCard}
                onChange={(e) =>
                  onPerfChange({ ...perf, yellowCard: e.target.checked })
                }
              />
              Yellow card
            </label>
            <label className="flex items-center gap-2 font-body text-xs text-sky">
              <input
                type="checkbox"
                checked={perf.redCard}
                onChange={(e) =>
                  onPerfChange({ ...perf, redCard: e.target.checked })
                }
              />
              Red card
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
