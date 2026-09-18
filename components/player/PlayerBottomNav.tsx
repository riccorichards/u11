"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, TreePine, Puzzle } from "lucide-react";

const TABS = [
  { href: "/home", label: "Home", icon: Home, ready: true },
  { href: "/my-dashboard", label: "My Stats", icon: BarChart3, ready: true },
  { href: "/skill-tree", label: "Skill Tree", icon: TreePine, ready: true },
  { href: "/challenges", label: "Challenges", icon: Puzzle, ready: true },
];

export function PlayerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      style={{
        background: "linear-gradient(to top, #031229 55%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around rounded-2xl border border-sky/10 bg-[#041B3A]/90 px-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.ready ? tab.href : "#"}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all ${
                !tab.ready ? "pointer-events-none opacity-30" : ""
              } ${active ? "bg-ocean/15" : ""}`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 2}
                className={`transition-all ${active ? "scale-110 text-ocean" : "text-sky/50"}`}
              />
              <span
                className={`font-body text-[10px] font-medium transition-colors ${
                  active ? "text-ocean" : "text-sky/60"
                }`}
              >
                {tab.label}
              </span>
              {active && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-ocean" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
