import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getChallenges } from "@/lib/getChallenges";
import { ChallengeCard } from "@/components/player/ChallengeCard";
import { PuzzleArchive } from "@/components/player/PuzzleArchive";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") redirect("/login");

  const challenges = await getChallenges(session.user.linkedPlayerId as string);

  return (
    <div className="px-6 pb-8 pt-8">
      {/* მთავარი სათაური */}
      <h1 className="font-display text-3xl font-extrabold text-mist">
        გამოწვევები
      </h1>
      <p className="mt-1 font-body text-sm text-sky/60">
        შენი პირადი მისიები და ტაქტიკური ფაზლები
      </p>

      {/* ჩელენჯების სექცია */}
      <section className="mt-6">
        <p className="font-body text-xs uppercase tracking-wide text-sky font-semibold">
          🎯 ჩემი გამოწვევები
        </p>
        <div className="mt-3 space-y-2">
          {challenges.length === 0 && (
            <p className="font-body text-sm text-sky/50">
              აქტიური გამოწვევები ჯერ არ გაქვს.
            </p>
          )}
          {challenges.map((c: any) => (
            <ChallengeCard key={c._id} challenge={c} />
          ))}
        </div>
      </section>

      {/* ფაზლების სექცია */}
      <section className="mt-8">
        <p className="font-body text-xs uppercase tracking-wide text-sky font-semibold">
          🧩 ტაქტიკური ფაზლები
        </p>
        <div className="mt-3">
          <PuzzleArchive />
        </div>
      </section>
    </div>
  );
}
