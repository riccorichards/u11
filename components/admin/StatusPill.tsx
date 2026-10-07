// Path: components/admin/StatusPill.tsx

export default function StatusPill({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-body text-xs"
      style={{ backgroundColor: `${color}22`, color }}
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
