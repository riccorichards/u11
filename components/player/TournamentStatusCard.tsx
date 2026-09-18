import connectDB from "@/lib/mongodb";
import Tournament from "@/lib/models/Tournament";

const STAGE_LABEL: Record<string, string> = {
  UPCOMING: "Starting Soon",
  GROUP_STAGE: "Group Stage",
  ROUND_16: "Round of 16",
  QUARTERFINAL: "Quarterfinal",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
  COMPLETED: "Completed",
};

export async function TournamentStatusCard() {
  await connectDB();
  const tournaments = await Tournament.find({ result: null }).lean();
  const today = new Date().toISOString().slice(0, 10);

  const active = tournaments.find(
    (t: any) => t.startDate <= today && (!t.endDate || t.endDate >= today),
  );

  if (active) {
    return (
      <div className="mx-6 mt-6 rounded-2xl border border-[#E0A72F]/30 bg-[#E0A72F]/10 p-5">
        <p className="font-body text-xs uppercase tracking-wide text-[#E0A72F]">
          🏆 Live Tournament
        </p>
        <h2 className="mt-1 font-display text-xl font-bold text-mist">
          {active.name}
        </h2>
        <p className="mt-1 font-body text-sm text-sky/70">
          {STAGE_LABEL[active.currentStage]}
        </p>
      </div>
    );
  }

  const upcoming = tournaments
    .filter((t: any) => t.startDate > today)
    .sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))[0];

  if (!upcoming) return null; // ← explicit guard, no active AND no upcoming

  const daysUntil = Math.ceil(
    (new Date(upcoming.startDate).getTime() - new Date(today).getTime()) /
      86400000,
  );

  return (
    <div className="mx-6 mt-6 rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        📅 Coming Soon
      </p>
      <h2 className="mt-1 font-display text-xl font-bold text-mist">
        {upcoming.name}
      </h2>
      <p className="mt-1 font-body text-sm text-sky/70">
        In {daysUntil} day{daysUntil !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
