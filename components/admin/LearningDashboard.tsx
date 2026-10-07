// Path: components/admin/LearningDashboard.tsx
"use client";

import Link from "next/link";
import MasteryQueue from "./MasteryQueue";
import { card, cx } from "./ui";

const LINKS = [
  {
    href: "/admin/skill-tree-builder",
    label: "Skill Tree",
    desc: "Modules, topics, lessons, and opening topics for players",
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    desc: "Puzzles, field checks and challenges for each topic",
  },
  {
    href: "/admin/grading",
    label: "Grading",
    desc: "Grade field checks and log challenge attempts after training",
  },
  {
    href: "/admin/groups",
    label: "Groups",
    desc: "Custom sets of players for assigning work",
  },
  {
    href: "/admin/badges",
    label: "Badges",
    desc: "Create badges and award them by hand",
  },
];

/** Drop this into app/admin/page.tsx wherever the learning section should appear. */
export default function LearningDashboard() {
  return (
    <section aria-labelledby="learning-heading" className="space-y-4">
      <h2
        id="learning-heading"
        className="font-display text-2xl font-extrabold text-mist"
      >
        Learning
      </h2>
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                card,
                "block p-5 transition hover:border-sky/30 hover:bg-white/[0.04]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/60",
              )}
            >
              <span className="block font-display text-lg font-bold text-mist">
                {l.label}
              </span>
              <span className="mt-1 block font-body text-sm text-sky/80">
                {l.desc}
              </span>
            </Link>
          ))}
        </div>
        <MasteryQueue />
      </div>
    </section>
  );
}
