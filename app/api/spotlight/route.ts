import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerModel from "@/lib/models/Player";
import MatchModel from "@/lib/models/Match";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import { calcDisciplineScore, type DisciplineEvent } from "@/lib/stats";

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

const CATEGORIES = [
  { key: "goals", title: "Top Scorers This Week" },
  { key: "assists", title: "Top Playmakers This Week" },
  { key: "mvpCount", title: "Most MVPs This Week" },
  { key: "trainingScore", title: "Best Training Form This Week" },
  { key: "attendance", title: "Most Dedicated This Week" },
  { key: "disciplineScore", title: "Most Disciplined This Week" },
] as const;

function getWeekRange(): { start: string; end: string; weekNumber: number } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const target = new Date(monday.valueOf());
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
    weekNumber,
  };
}

export async function GET() {
  try {
    await connectDB();
    const { start, end, weekNumber } = getWeekRange();
    const category = CATEGORIES[weekNumber % CATEGORIES.length];

    const [players, matches, sessions] = await Promise.all([
      PlayerModel.find({}).lean(),
      MatchModel.find({ date: { $gte: start, $lte: end } }).lean(),
      TrainingSessionModel.find({ date: { $gte: start, $lte: end } }).lean(),
    ]);

    const DisciplineLogModel = await getDisciplineLogModel();
    const disciplineEvents = DisciplineLogModel
      ? await DisciplineLogModel.find({
          date: { $gte: start, $lte: end },
        }).lean()
      : [];

    const values = players.map((player: any) => {
      const id = String(player._id);
      let value = 0;

      if (["goals", "assists", "mvpCount"].includes(category.key)) {
        const perfs = matches.flatMap((m: any) =>
          m.playerPerformances.filter((p: any) => String(p.playerId) === id),
        );
        if (category.key === "goals")
          value = perfs.reduce((s: number, p: any) => s + (p.goals ?? 0), 0);
        if (category.key === "assists")
          value = perfs.reduce((s: number, p: any) => s + (p.assists ?? 0), 0);
        if (category.key === "mvpCount")
          value = perfs.filter((p: any) => p.isMvp).length;
      }

      if (category.key === "trainingScore" || category.key === "attendance") {
        const logs = sessions
          .map((s: any) =>
            s.playerLogs.find((l: any) => String(l.playerId) === id),
          )
          .filter(Boolean);
        if (category.key === "attendance") value = logs.length;
        if (category.key === "trainingScore") {
          value = logs.length
            ? parseFloat(
                (
                  (logs.reduce((s: number, l: any) => s + l.prs, 0) /
                    logs.length) *
                  100
                ).toFixed(1),
              )
            : 0;
        }
      }

      if (category.key === "disciplineScore") {
        const events = disciplineEvents.filter(
          (e: any) => String(e.playerId) === id,
        ) as unknown as DisciplineEvent[];
        value = events.length ? calcDisciplineScore(events) : 0;
      }

      return {
        playerId: id,
        name: player.name,
        surname: player.surname,
        avatarUrl: player.avatarUrl ?? null,
        value,
      };
    });

    const top5 = values
      .filter((v) => v.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return NextResponse.json({
      category: category.title,
      weekStart: start,
      top5,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to compute spotlight" },
      { status: 500 },
    );
  }
}
