import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlayerProfile } from "@/lib/getPlayerProfile";
import { getPlayerBadges } from "@/lib/getPlayerBadges";
import { getPlayerPuzzles } from "@/lib/getPlayerPuzzles";
import { getSkillTreeProgress } from "@/lib/getSkillTreeProgress";
import { MatchHistoryList } from "@/components/player/MatchHistoryList";
import { TrainingHistoryList } from "@/components/player/TrainingHistoryList";
import { getChallenges } from "@/lib/getChallenges";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { TrendBanner } from "@/components/player/TrendBanner";
import PlayerRadarChart from "@/components/player/PlayerRadarChart";
import PillarRadar from "@/components/player/PillarRadar";
import { KPIProgressCard } from "@/components/player/KPIProgressCard";
import { BadgeShelf } from "@/components/player/BadgeShelf";
import { ChallengeCard } from "@/components/player/ChallengeCard";
import { ReadOnlyPuzzleList } from "@/components/admin/ReadOnlyPuzzleList";
import { PlayerSkillTree } from "@/components/admin/PlayerSkillTree";

export default async function ViewAsPlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH_ADMIN")
    redirect("/admin/login");

  const [profile, badges, puzzles, challenges] = await Promise.all([
    getPlayerProfile(params.id),
    getPlayerBadges(params.id),
    getPlayerPuzzles(params.id),
    getChallenges(params.id),
  ]);

  if (!profile) redirect("/admin/players");

  const {
    player,
    trainingRadar,
    pillarScores,
    pillarAssessments,
    developmentArc,
    kpiProgress,
    matchHistory,
    sessionHistory,
  } = profile;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/players/${params.id}`}
          className="font-body text-sm text-sky/70 hover:text-mist"
        >
          ← Back to Editor
        </Link>
        <span className="rounded-full bg-ocean/20 px-3 py-1 font-body text-xs text-ocean">
          👁 Viewing as {player.name} {player.surname}
        </span>
      </div>

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

      <div className="mt-6">
        <PlayerRadarChart
          radarData={trainingRadar}
          position={player.position}
        />
      </div>
      <div className="mt-4">
        <PillarRadar
          pillarScores={pillarScores}
          assessmentCount={pillarAssessments.length}
          position={player.position}
        />
      </div>
      <div className="mt-4">
        <KPIProgressCard kpiProgress={kpiProgress} />
      </div>
      <div className="mt-4">
        <BadgeShelf badges={badges} />
      </div>

      <div className="mt-4">
        <p className="font-body text-xs uppercase tracking-wide text-sky">
          🎯 Challenges
        </p>
        <div className="mt-2 space-y-2">
          {challenges.length === 0 && (
            <p className="font-body text-sm text-sky/50">
              No challenges assigned.
            </p>
          )}
          {challenges.map((c: any) => (
            <ChallengeCard key={c._id} challenge={c} />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <ReadOnlyPuzzleList puzzles={puzzles} />
      </div>

      <div className="mt-4">
        <p className="font-body text-xs uppercase tracking-wide text-sky">
          🌳 Skill Tree
        </p>
        <PlayerSkillTree playerId={params.id} position={player.position} />
      </div>

      <div className="mt-4">
        <MatchHistoryList matches={matchHistory} />
      </div>
      <div className="mt-4">
        <TrainingHistoryList sessions={sessionHistory} />
      </div>
    </div>
  );
}
