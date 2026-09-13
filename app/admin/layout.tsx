import { PitchMark } from "@/components/PitchMark";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-pitch-gradient">
      <PitchMark />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
