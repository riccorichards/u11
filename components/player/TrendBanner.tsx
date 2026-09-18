import { TrendingUp, Minus, TrendingDown, HelpCircle } from "lucide-react";

const ARC_CONTENT: Record<string, { icon: any; text: string; color: string }> =
  {
    progressing: {
      icon: TrendingUp,
      text: "You're improving — keep it up!",
      color: "#1FA97A",
    },
    plateauing: {
      icon: Minus,
      text: "Holding steady — time to push for the next level",
      color: "#E0A72F",
    },
    regressing: {
      icon: TrendingDown,
      text: "A tougher stretch — talk to your coach about it",
      color: "#E8735C",
    },
    insufficient_data: {
      icon: HelpCircle,
      text: "Keep training — your trend will show up soon",
      color: "#97CADB",
    },
  };

export function TrendBanner({
  arc,
  confidence,
}: {
  arc: string;
  confidence: string;
}) {
  const content = ARC_CONTENT[arc] ?? ARC_CONTENT.insufficient_data;
  const Icon = content.icon;

  return (
    <div className="mx-6 mt-6 flex items-center gap-3 rounded-2xl border border-sky/10 bg-white/[0.03] p-4">
      <Icon size={22} color={content.color} />
      <p className="font-body text-sm text-mist">{content.text}</p>
    </div>
  );
}
