import { PlayerAvatar } from "@/components/admin/PlayerAvatar";
import { XP_PER_LEVEL } from "@/lib/xp";

export function PlayerHeader({
  name,
  avatarUrl,
  currentXp,
  level,
  currentStreak,
}: {
  name: string;
  avatarUrl: string | null;
  currentXp: number;
  level: number;
  currentStreak: number;
}) {
  const xpIntoLevel = currentXp % XP_PER_LEVEL;
  const pct = (xpIntoLevel / XP_PER_LEVEL) * 100;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-4 px-6 pt-8">
      <div className="relative h-20 w-20 shrink-0">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 76 76">
          <circle
            cx="38"
            cy="38"
            r="34"
            fill="none"
            stroke="#ffffff1a"
            strokeWidth="5"
          />
          <circle
            cx="38"
            cy="38"
            r="34"
            fill="none"
            stroke="#018ABE"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-[7px] overflow-hidden rounded-full">
          <PlayerAvatar
            name={name}
            surname=""
            avatarUrl={avatarUrl}
            size={62}
          />
        </div>
        <div className="absolute -bottom-1 -right-1 rounded-full bg-[#E0A72F] px-2 py-0.5 font-display text-xs font-extrabold text-navy-950">
          Lv {level}
        </div>
      </div>

      <div>
        <p className="font-body text-sm text-sky">Welcome back,</p>
        <h1 className="font-display text-3xl font-extrabold leading-tight text-mist">
          {name}!
        </h1>
        {currentStreak > 0 && (
          <p className="mt-0.5 font-body text-sm text-[#E0A72F]">
            🔥 {currentStreak} day streak
          </p>
        )}
      </div>
    </div>
  );
}
