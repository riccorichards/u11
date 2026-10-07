import type { Types } from "mongoose";
import type { ProgressStatus } from "@/lib/models/SkillNodeProgress";
import { nodeAppliesToPosition } from "./positions";

/** react-d3-tree's RawNodeDatum shape. Custom data lives in `attributes`. */
export interface TreeDatum {
  name: string;
  attributes: Record<string, string | number | boolean>;
  children: TreeDatum[];
}

export interface ModuleRow {
  _id: Types.ObjectId;
  slug: string;
  title: { ka: string; en?: string };
  sequenceOrder: number;
  isPublished: boolean;
  icon?: string;
}

export interface NodeRow {
  _id: Types.ObjectId;
  title: string;
  titleEn?: string;
  moduleId?: Types.ObjectId | null;
  parentId?: Types.ObjectId | null;
  sequenceOrder?: number;
  tierLevel?: number;
  positions?: string[];
  prerequisites?: Types.ObjectId[];
  lesson?: { videoUrl?: string; diagramUrl?: string; keyPoints?: string[] };
}

export interface BuildOptions {
  /** Show only topics for this position; their non-matching parents stay as greyed context. */
  position?: string | null;
  /** nodeId → status. When given, every topic gets a status (default LOCKED). */
  progress?: Map<string, ProgressStatus>;
  /** Keep modules with no visible topics (useful in the coach builder). */
  includeEmptyModules?: boolean;
}

export interface ModuleTree {
  moduleId: string | null;
  slug: string;
  title: { ka: string; en: string };
  icon: string;
  isPublished: boolean;
  topicCount: number;
  masteredCount: number;
  tree: TreeDatum;
}

const UNASSIGNED = "__unassigned__";

function compareNodes(a: NodeRow, b: NodeRow): number {
  return (
    (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0) ||
    (a.tierLevel ?? 0) - (b.tierLevel ?? 0) ||
    a.title.localeCompare(b.title)
  );
}

/**
 * Builds one tree per module, each rooted at the module itself so it can be
 * passed straight to <Tree data={...} />. Topics whose module is missing land in
 * an "Unassigned" tree if `modules` doesn't filter them out first.
 */
export function buildModuleTrees(
  modules: ModuleRow[],
  nodes: NodeRow[],
  opts: BuildOptions = {},
): ModuleTree[] {
  const moduleIds = new Set(modules.map((m) => String(m._id)));
  const nodesByModule = new Map<string, NodeRow[]>();
  for (const n of nodes) {
    const key =
      n.moduleId && moduleIds.has(String(n.moduleId))
        ? String(n.moduleId)
        : UNASSIGNED;
    nodesByModule.set(key, [...(nodesByModule.get(key) ?? []), n]);
  }

  const sortedModules = [...modules].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  const result: ModuleTree[] = [];

  const entries: { module: ModuleRow | null; key: string }[] =
    sortedModules.map((m) => ({
      module: m,
      key: String(m._id),
    }));
  if (nodesByModule.has(UNASSIGNED))
    entries.push({ module: null, key: UNASSIGNED });

  for (const { module, key } of entries) {
    const moduleNodes = nodesByModule.get(key) ?? [];
    const ids = new Set(moduleNodes.map((n) => String(n._id)));
    const children = new Map<string, NodeRow[]>();
    const roots: NodeRow[] = [];
    for (const n of moduleNodes) {
      const parentKey = n.parentId ? String(n.parentId) : null;
      // A parent in another module (or deleted) makes this a root of its module.
      if (parentKey && ids.has(parentKey) && parentKey !== String(n._id)) {
        children.set(parentKey, [...(children.get(parentKey) ?? []), n]);
      } else {
        roots.push(n);
      }
    }

    let topicCount = 0;
    let masteredCount = 0;
    const visited = new Set<string>();

    const build = (n: NodeRow): TreeDatum | null => {
      const id = String(n._id);
      if (visited.has(id)) return null; // guards against parent cycles
      visited.add(id);

      const kids = (children.get(id) ?? [])
        .sort(compareNodes)
        .map(build)
        .filter((c): c is TreeDatum => c !== null);
      const matches = nodeAppliesToPosition(n.positions, opts.position);
      if (!matches && kids.length === 0) return null;

      const status = opts.progress ? (opts.progress.get(id) ?? "LOCKED") : null;
      if (matches) {
        topicCount++;
        if (status === "MASTERED") masteredCount++;
      }

      const lesson = n.lesson ?? {};
      return {
        name: n.title,
        attributes: {
          id,
          kind: "topic",
          titleEn: n.titleEn ?? "",
          isContext: !matches,
          positions: (n.positions?.length ? n.positions : ["ALL"]).join(","),
          hasLesson: Boolean(
            lesson.videoUrl || lesson.diagramUrl || lesson.keyPoints?.length,
          ),
          prerequisiteCount: n.prerequisites?.length ?? 0,
          ...(status ? { status } : {}),
        },
        children: kids,
      };
    };

    const topLevel = roots
      .sort(compareNodes)
      .map(build)
      .filter((c): c is TreeDatum => c !== null);
    if (topLevel.length === 0 && !opts.includeEmptyModules) continue;

    const title = module
      ? { ka: module.title.ka, en: module.title.en ?? "" }
      : { ka: "მოდულის გარეშე", en: "Unassigned" };

    result.push({
      moduleId: module ? String(module._id) : null,
      slug: module?.slug ?? "unassigned",
      title,
      icon: module?.icon ?? "",
      isPublished: module?.isPublished ?? false,
      topicCount,
      masteredCount,
      tree: {
        name: title.ka,
        attributes: {
          id: module ? String(module._id) : UNASSIGNED,
          kind: "module",
          isContext: false,
        },
        children: topLevel,
      },
    });
  }

  return result;
}
