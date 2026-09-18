import { PitchMark } from "@/components/PitchMark";
import { PlayerBottomNav } from "@/components/player/PlayerBottomNav";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-pitch-gradient">
      {/* Soft floodlight glow, top of the screen — gives the flat pitch
          gradient somewhere for the eye to land before content loads in */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, #018ABE, transparent 70%)",
        }}
      />
      <PitchMark />

      <div className="relative z-10 animate-fadeUp pb-28">{children}</div>

      <PlayerBottomNav />
    </div>
  );
}
