"use client";
import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { RatingSlider } from "./RatingSlider";

const METRICS = [
  { key: "workRate", label: "Work Rate" },
  { key: "technicalQuality", label: "Technical Quality" },
  { key: "tacticalAwareness", label: "Tactical Awareness" },
  { key: "focusLevel", label: "Focus" },
  { key: "bodyLanguage", label: "Body Language" },
  { key: "coachability", label: "Coachability" },
] as const;

const EMOTIONAL_STATES = [
  "happy",
  "neutral",
  "tired",
  "frustrated",
  "anxious",
] as const;

export type PlayerGrade = {
  workRate: number;
  technicalQuality: number;
  tacticalAwareness: number;
  focusLevel: number;
  bodyLanguage: number;
  coachability: number;
  emotionalState: (typeof EMOTIONAL_STATES)[number];
  fatigueLevel: number;
  injuryFlag: boolean;
  minutesParticipated: number;
};

export function PlayerGradeRow({
  player,
  present,
  onTogglePresent,
  grade,
  onGradeChange,
}: {
  player: {
    _id: string;
    name: string;
    surname: string;
    number: number;
    avatarUrl?: string | null;
  };
  present: boolean;
  onTogglePresent: () => void;
  grade: PlayerGrade;
  onGradeChange: (grade: PlayerGrade) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border ${present ? "border-sky/10" : "border-sky/5"} bg-white/[0.02]`}
    >
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => present && setExpanded(!expanded)}
          disabled={!present}
          className={`flex flex-1 items-center gap-3 text-left ${!present ? "opacity-40" : ""}`}
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
              {present && !expanded && " · Tap to adjust (defaults: 7)"}
            </p>
          </div>
        </button>

        <button
          onClick={onTogglePresent}
          className={`rounded-md px-3 py-1.5 font-body text-xs font-medium transition ${
            present
              ? "bg-[#1FA97A]/20 text-[#1FA97A]"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {present ? "Present" : "Absent"}
        </button>
      </div>

      {present && expanded && (
        <div className="space-y-4 border-t border-sky/10 p-4">
          <div className="grid grid-cols-2 gap-4">
            {METRICS.map((m) => (
              <RatingSlider
                key={m.key}
                label={m.label}
                value={grade[m.key]}
                onChange={(v) => onGradeChange({ ...grade, [m.key]: v })}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs text-sky">
                Emotional State
              </label>
              <select
                value={grade.emotionalState}
                onChange={(e) =>
                  onGradeChange({
                    ...grade,
                    emotionalState: e.target.value as any,
                  })
                }
                className="mt-1 w-full rounded-md border border-sky/20 bg-transparent p-1.5 font-body text-sm text-mist"
              >
                {EMOTIONAL_STATES.map((s) => (
                  <option key={s} value={s} className="bg-navy-950">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <RatingSlider
              label="Fatigue Level"
              value={grade.fatigueLevel}
              onChange={(v) => onGradeChange({ ...grade, fatigueLevel: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-body text-xs text-sky">
                Minutes Participated
              </label>
              <input
                type="number"
                value={grade.minutesParticipated}
                onChange={(e) =>
                  onGradeChange({
                    ...grade,
                    minutesParticipated: Number(e.target.value),
                  })
                }
                className="mt-1 w-24 border-0 border-b border-sky/25 bg-transparent pb-1 font-body text-mist outline-none focus:border-ocean"
              />
            </div>
            <label className="flex items-center gap-2 font-body text-xs text-sky">
              <input
                type="checkbox"
                checked={grade.injuryFlag}
                onChange={(e) =>
                  onGradeChange({ ...grade, injuryFlag: e.target.checked })
                }
              />
              Injury flag
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
