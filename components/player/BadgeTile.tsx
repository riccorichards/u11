// Path: components/player/BadgeTile.tsx

import { Award, Lock } from "lucide-react";
import { cx } from "@/components/admin/ui";
import { playerCard } from "./theme";

interface Props {
  title: string;
  iconUrl: string | null;
  earned: boolean;
  subtitle?: string;
  progress?: { done: number; total: number } | null;
}

export default function BadgeTile({
  title,
  iconUrl,
  earned,
  subtitle,
  progress,
}: Props) {
  return (
    <div
      className={cx(
        playerCard,
        "flex flex-col items-center p-4 text-center",
        !earned && "opacity-80",
      )}
    >
      <div
        className={cx(
          "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full",
          earned
            ? "bg-[#E0A72F]/20 shadow-[0_0_24px_rgba(224,167,47,0.35)]"
            : "bg-white/[0.06] grayscale",
        )}
      >
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Award
            size={30}
            className={earned ? "text-[#E0A72F]" : "text-sky/50"}
            aria-hidden
          />
        )}
        {!earned && (
          <span
            className="absolute bottom-0 right-0 rounded-full bg-[#0B2133] p-1 text-sky/70"
            aria-hidden
          >
            <Lock size={12} />
          </span>
        )}
      </div>
      <p className="mt-3 font-body text-sm font-semibold text-mist">{title}</p>
      {subtitle && (
        <p className="mt-1 font-body text-xs text-sky/70">{subtitle}</p>
      )}
      {progress && (
        <div className="mt-2 w-full">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            aria-label={title}
          >
            <div
              className="h-full rounded-full bg-[#E0A72F]"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
