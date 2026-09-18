"use client";
import Tree from "react-d3-tree";

const STATUS_COLOR: Record<string, string> = {
  LOCKED: "#3E5878",
  IN_PROGRESS: "#E0A72F",
  MASTERED: "#1FA97A",
};

import { buildSkillTree as buildTree } from "@/lib/buildSkillTree";


export function SkillTreePreview({
  nodes,
  progressMap,
  onSelectNode,
  selectedNodeId,
}: {
  nodes: any[];
  progressMap: Record<string, string>;
  onSelectNode: (id: string) => void;
  selectedNodeId: string | null;
}) {
  const treeData = { name: "Root", children: buildTree(nodes, null) };

  if (nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-sky/10 bg-white/[0.02]">
        <p className="font-body text-sm text-sky/50">
          No nodes in this branch yet
        </p>
      </div>
    );
  }

  return (
    <div className="h-[420px] rounded-lg border border-sky/10 bg-white/[0.02]">
      <Tree
        data={treeData}
        orientation="vertical"
        pathFunc="step"
        translate={{ x: 250, y: 40 }}
        zoomable
        collapsible={false}
        renderCustomNodeElement={({ nodeDatum }: any) => {
          const id = nodeDatum.attributes?.id;
          const status = id ? progressMap[id] : undefined;
          const fill = status ? STATUS_COLOR[status] : "#0A2540";
          const isSelected = id === selectedNodeId;
          const isRoot = nodeDatum.name === "Root";

          if (isRoot) return <g />;

          return (
            <g
              onClick={() => id && onSelectNode(id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                r={16}
                fill={fill}
                stroke={isSelected ? "#018ABE" : "#97CADB33"}
                strokeWidth={isSelected ? 3 : 1}
              />
              <text
                x={22}
                dy={4}
                style={{ fontFamily: "DM Sans", fontSize: 12, fill: "#D6E8EE" }}
              >
                {nodeDatum.name}
              </text>
            </g>
          );
        }}
      />
    </div>
  );
}
