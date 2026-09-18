import connectDB from "@/lib/mongodb";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import { calcRollingTeamCondition } from "@/lib/stats";

export async function TeamPulseCard() {
  await connectDB();
  const sessions = await TrainingSessionModel.find({})
    .sort({ date: 1 })
    .limit(10)
    .lean();
  const { tc, ms } = calcRollingTeamCondition(sessions as any);

  const tcPct = Math.round(tc * 100);
  const msPct = Math.round(ms * 100);
  const isHighEnergy = tcPct >= 85;

  return (
    <div className="mx-6 mt-6 rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs uppercase tracking-wide text-sky">
          ⚡ Team Pulse
        </p>
        {isHighEnergy && (
          <span className="rounded-full bg-[#E0A72F]/20 px-2.5 py-1 font-body text-xs font-medium text-[#E0A72F]">
            🔥 High Energy Squad
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-5">
        <div>
          <p className="font-display text-3xl font-extrabold text-mist">
            {tcPct}%
          </p>
          <p className="font-body text-xs text-sky/60">Condition</p>
          <div className="mt-2 h-2.5 rounded-full bg-white/10">
            <div
              className="h-2.5 rounded-full bg-ocean"
              style={{ width: `${tcPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="font-display text-3xl font-extrabold text-mist">
            {msPct}%
          </p>
          <p className="font-body text-xs text-sky/60">Mentality</p>
          <div className="mt-2 h-2.5 rounded-full bg-white/10">
            <div
              className="h-2.5 rounded-full bg-[#1FA97A]"
              style={{ width: `${msPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
