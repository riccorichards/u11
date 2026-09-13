const PALETTE = [
  "#018ABE",
  "#1FA97A",
  "#E8735C",
  "#E0A72F",
  "#7C6FE0",
  "#3E7CB1",
];

export function colorForName(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name: string, surname: string) {
  return `${name[0] ?? ""}${surname[0] ?? ""}`.toUpperCase();
}
