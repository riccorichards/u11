import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Player from "@/lib/models/Player";
import { PlayerSkillTree } from "@/components/admin/PlayerSkillTree";

export default async function SkillTreePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") redirect("/login");

  await connectDB();
  const player = await Player.findById(session.user.linkedPlayerId).lean();
  if (!player) redirect("/login");

  return (
    <div className="pb-8">
      <div className="px-6 pt-8">
        <h1 className="font-display text-3xl font-extrabold text-mist">
          Skill Tree
        </h1>
        <p className="mt-1 font-body text-sm text-sky/60">
          Grow your game, one skill at a time
        </p>
      </div>
      <PlayerSkillTree
        playerId={String(player._id)}
        position={player.position}
      />
    </div>
  );
}
