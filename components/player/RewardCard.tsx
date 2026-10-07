// Path: components/player/RewardCard.tsx

import { Award } from "lucide-react";
import { copy } from "./copy";
import type { Rewards } from "./types";

/** The moment a task is passed. The only animation in the learning screens. */
export default function RewardCard({ rewards }: { rewards: Rewards | null }) {
  return (
    <div
      role="status"
      className="motion-safe:animate-[reward-pop_420ms_cubic-bezier(.2,1.4,.4,1)] rounded-2xl border border-[#1FA97A]/40 bg-[#1FA97A]/15 px-5 py-4 text-center"
    >
      <style>{`@keyframes reward-pop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
      <p className="font-display text-xl font-extrabold text-mist">
        {copy.reward.title}
      </p>
      {rewards && rewards.xp > 0 && (
        <p className="mt-1 font-display text-3xl font-extrabold text-[#1FA97A]">
          {copy.reward.xp(rewards.xp)}
        </p>
      )}
      {rewards?.badge && (
        <p className="mt-2 inline-flex items-center gap-2 font-body text-sm font-semibold text-[#E0A72F]">
          <Award size={18} aria-hidden />
          {copy.reward.badge(rewards.badge.title)}
        </p>
      )}
    </div>
  );
}
