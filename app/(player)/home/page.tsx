import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Player from "@/lib/models/Player";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { TodaysPuzzle } from "@/components/player/TodaysPuzzle";
import { TournamentStatusCard } from "@/components/player/TournamentStatusCard";
import { TeamPulseCard } from "@/components/player/TeamPulseCard";
import { WeeklySpotlight } from "@/components/player/WeeklySpotlight";
import { TeamRoster } from "@/components/player/TeamRoster";
import { TeamMetadataCard } from "@/components/player/TeamMetadataCard";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") redirect("/login");

  await connectDB();
  const player = await Player.findById(session.user.linkedPlayerId).lean();
  if (!player) redirect("/login");

  return (
    <div className="pb-8">
      <PlayerHeader
        name={player.name}
        avatarUrl={player.avatarUrl ?? null}
        currentXp={player.currentXp ?? 0}
        level={player.level ?? 1}
        currentStreak={player.currentStreak ?? 0}
      />
      <TeamMetadataCard />
      <TournamentStatusCard />
      <TeamPulseCard />
      <WeeklySpotlight />
      <TeamRoster />
      <TodaysPuzzle />
    </div>
  );
}
