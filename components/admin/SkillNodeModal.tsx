"use client";
import { X, Lock, Sparkles, Star } from "lucide-react";

const STATUS_INFO: Record<string, { icon: any; label: string; color: string }> =
  {
    LOCKED: { icon: Lock, label: "Locked", color: "#97CADB" },
    IN_PROGRESS: { icon: Sparkles, label: "In Progress", color: "#018ABE" },
    MASTERED: { icon: Star, label: "Mastered", color: "#E0A72F" },
  };

export function SkillNodeModal({
  node,
  status,
  relatedPuzzles,
  onClose,
}: {
  node: any;
  status: string;
  relatedPuzzles: any[];
  onClose: () => void;
}) {
  const info = STATUS_INFO[status];
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl border border-sky/10 bg-[#041B3A] p-6 sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1"
            style={{ backgroundColor: `${info.color}22` }}
          >
            <Icon size={14} color={info.color} />
            <span
              className="font-body text-xs font-medium"
              style={{ color: info.color }}
            >
              {info.label}
            </span>
          </div>
          <button onClick={onClose} className="text-sky/50 hover:text-mist">
            <X size={20} />
          </button>
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold text-mist">
          {node.title}
        </h2>
        {node.description && (
          <p className="mt-2 font-body text-sm text-sky/80">
            {node.description}
          </p>
        )}

        {node.requirements && (
          <div className="mt-4 rounded-lg bg-white/5 p-3">
            <p className="font-body text-xs text-sky">What it takes</p>
            <p className="mt-1 font-body text-sm text-mist">
              {node.requirements}
            </p>
          </div>
        )}

        {relatedPuzzles.length > 0 && (
          <div className="mt-4">
            <p className="font-body text-xs text-sky">
              🧩 Puzzles for this skill
            </p>
            <div className="mt-2 space-y-1.5">
              {relatedPuzzles.map((p: any) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <span className="font-body text-sm text-mist">{p.title}</span>
                  <span className="font-mono text-xs text-ocean">
                    {p.xpReward} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-ocean py-2.5 font-body text-sm font-medium text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
