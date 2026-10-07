// Path: components/player/Pill.tsx

export default function Pill({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-body text-xs font-medium"
      style={{ backgroundColor: `${color}26`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}
