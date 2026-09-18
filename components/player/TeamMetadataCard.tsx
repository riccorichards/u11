async function getTeamData() {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/team`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function TeamMetadataCard() {
  const data = await getTeamData();
  const s = data.stats; // the actual W-D-L/goals fields live here, not at the top level

  const statBoxes = [
    { label: "Record", value: `${s.wins}-${s.draws}-${s.losses}` },
    { label: "Goals", value: `${s.totalGoals}:${s.receivedGoals}` },
    { label: "Teamwork", value: `${data.teamworkScore}%` },
    { label: "Team XP", value: data.totalTeamXp },
    { label: "Badges Won", value: data.totalBadgesAwarded },
    { label: "Clean Sheets", value: s.cleanSheets },
  ];

  return (
    <div className="mx-6 mt-6 rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        📊 Season So Far
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {statBoxes.map((box) => (
          <div
            key={box.label}
            className="rounded-lg bg-white/[0.03] p-3 text-center"
          >
            <p className="font-display text-xl font-bold text-mist">
              {box.value}
            </p>
            <p className="mt-0.5 font-body text-xs text-sky/60">{box.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
