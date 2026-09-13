import Link from "next/link";

const sections = [
  {
    href: "/admin/players",
    label: "Roster",
    desc: "Create players, manage invite codes",
    ready: true,
  },
  {
    href: "/admin/training-log",
    label: "Training Log",
    desc: "AI-assisted session grading",
    ready: false,
  },
  {
    href: "/admin/skill-tree-builder",
    label: "Skill Tree",
    desc: "Build the tactical progression map",
    ready: false,
  },
  {
    href: "/admin/content-manager",
    label: "Content Manager",
    desc: "Puzzles & badges",
    ready: false,
  },
  {
    href: "/admin/matches",
    label: "Matches",
    desc: "Post-match player reports",
    ready: false,
  },
];

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-pitch-gradient px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold text-mist">
          Coach Dashboard
        </h1>
        <p className="mt-1 font-body text-sm text-sky">Dinamo Batumi U11</p>

        <div className="mt-10 grid gap-3">
          {sections.map((s) =>
            s.ready ? (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-lg border border-sky/15 bg-white/5 p-4 transition hover:border-ocean/50 hover:bg-white/10"
              >
                <p className="font-body text-base font-medium text-mist">
                  {s.label}
                </p>
                <p className="font-body text-sm text-sky/70">{s.desc}</p>
              </Link>
            ) : (
              <div
                key={s.href}
                className="rounded-lg border border-sky/10 bg-white/[0.02] p-4 opacity-50"
              >
                <p className="font-body text-base font-medium text-mist">
                  {s.label}
                </p>
                <p className="font-body text-sm text-sky/50">
                  {s.desc} — coming soon
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
