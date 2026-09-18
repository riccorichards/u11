export function buildSkillTree(
  nodes: any[],
  parentId: string | null = null,
): any[] {
  return nodes
    .filter((n) => String(n.parentId ?? null) === String(parentId))
    .map((n) => ({
      name: n.title,
      attributes: { id: n._id },
      children: buildSkillTree(nodes, n._id),
    }));
}
