import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPlayerProfile } from "@/lib/getPlayerProfile";
import { getPlayerBadges } from "@/lib/getPlayerBadges";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import PlayerRadarChart from "@/components/player/PlayerRadarChart";
import PillarRadar from "@/components/player/PillarRadar";
import { KPIProgressCard } from "@/components/player/KPIProgressCard";
import { BadgeShelf } from "@/components/player/BadgeShelf";
import { TrendBanner } from "@/components/player/TrendBanner";

export default async function MyDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") redirect("/login");

  const playerId = session.user.linkedPlayerId as string;

  const [profile, badges] = await Promise.all([
    getPlayerProfile(playerId),
    getPlayerBadges(playerId),
  ]);

  if (!profile) redirect("/login");

  const {
    player,
    trainingRadar,
    pillarScores,
    pillarAssessments,
    developmentArc,
    kpiProgress,
  } = profile;

  return (
    <div className="pb-8">
      <PlayerHeader
        name={player.name}
        avatarUrl={player.avatarUrl ?? null}
        currentXp={player.currentXp ?? 0}
        level={player.level ?? 1}
        currentStreak={player.currentStreak ?? 0}
      />
      <TrendBanner
        arc={developmentArc.arc}
        confidence={developmentArc.confidence}
      />
      <div className="mx-6 mt-6">
        <PlayerRadarChart
          radarData={trainingRadar}
          position={player.position}
        />
      </div>
      <div className="mx-6 mt-4">
        <PillarRadar
          pillarScores={pillarScores}
          assessmentCount={pillarAssessments.length}
          position={player.position}
        />
      </div>
      <div className="mx-6 mt-4">
        <KPIProgressCard kpiProgress={kpiProgress} />
      </div>
      <div className="mx-6 mt-4">
        <BadgeShelf badges={badges} />
      </div>
    </div>
  );
}
