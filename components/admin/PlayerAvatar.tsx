import { colorForName, initials } from "@/lib/avatarColor";

export function PlayerAvatar({
  name,
  surname,
  avatarUrl,
  size = 40,
}: {
  name: string;
  surname: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name} ${surname}`}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: colorForName(name + surname),
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
    >
      {initials(name, surname) || "?"}
    </div>
  );
}
