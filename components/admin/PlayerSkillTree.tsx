"use client";
import { useEffect, useState } from "react";
import Tree from "react-d3-tree";
import { buildSkillTree } from "@/lib/buildSkillTree";
import { SkillNodeModal } from "./SkillNodeModal";

const STATUS_STYLE: Record<
  string,
  { fill: string; glow: string; icon: string }
> = {
  LOCKED: { fill: "#0A2540", glow: "none", icon: "🔒" },
  IN_PROGRESS: {
    fill: "#018ABE",
    glow: "0 0 12px rgba(1,138,190,0.7)",
    icon: "✨",
  },
  MASTERED: {
    fill: "#E0A72F",
    glow: "0 0 14px rgba(224,167,47,0.7)",
    icon: "⭐",
  },
};

export function PlayerSkillTree({
  playerId,
  position,
}: {
  playerId: string;
  position: string;
}) {
  const [branch, setBranch] = useState<"global" | "position">("global");
  const [nodes, setNodes] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/skill-tree")
      .then((r) => r.json())
      .then(setNodes);
    fetch(`/api/skill-tree/progress?playerId=${playerId}`)
      .then((r) => r.json())
      .then(setProgressMap);
    fetch("/api/puzzles")
      .then((r) => r.json())
      .then(setPuzzles);
  }, [playerId]);

  const branchNodes = nodes.filter((n) =>
    branch === "global"
      ? n.isGlobal
      : !n.isGlobal && n.positionGroup === position,
  );

  const treeData = {
    name: "Root",
    children: buildSkillTree(branchNodes, null),
  };

  return (
    <div className="px-4 pt-4">
      <div className="flex gap-2">
        <button
          onClick={() => setBranch("global")}
          className={`rounded-full px-4 py-1.5 font-body text-sm transition ${
            branch === "global"
              ? "bg-ocean text-white"
              : "border border-sky/20 text-sky/70"
          }`}
        >
          🌍 Global
        </button>
        <button
          onClick={() => setBranch("position")}
          className={`rounded-full px-4 py-1.5 font-body text-sm transition ${
            branch === "position"
              ? "bg-ocean text-white"
              : "border border-sky/20 text-sky/70"
          }`}
        >
          ⚽ {position} Skills
        </button>
      </div>

      {branchNodes.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-3xl">🌱</p>
          <p className="font-body text-sm text-sky/50">
            Nothing planted here yet — check back soon!
          </p>
        </div>
      ) : (
        <div className="mt-4 h-[480px] w-full">
          <Tree
            data={treeData}
            orientation="vertical"
            pathFunc="step"
            translate={{ x: 190, y: 50 }}
            zoomable
            collapsible={false}
            renderCustomNodeElement={({ nodeDatum }: any) => {
              if (nodeDatum.name === "Root") return <g />;
              const id = nodeDatum.attributes?.id;
              const status = progressMap[id] ?? "LOCKED";
              const style = STATUS_STYLE[status];
              const node = branchNodes.find((n) => n._id === id);

              return (
                <g
                  onClick={() => node && setSelectedNode(node)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={22}
                    fill={style.fill}
                    style={{
                      filter:
                        style.glow !== "none"
                          ? `drop-shadow(${style.glow})`
                          : "none",
                    }}
                    stroke={status === "LOCKED" ? "#97CADB22" : "#ffffff33"}
                    strokeWidth={2}
                  />
                  <text x={0} y={5} textAnchor="middle" fontSize={14}>
                    {style.icon}
                  </text>
                  <text
                    x={0}
                    y={38}
                    textAnchor="middle"
                    style={{
                      fontFamily: "DM Sans",
                      fontSize: 11,
                      fill: status === "LOCKED" ? "#97CADB66" : "#D6E8EE",
                    }}
                  >
                    {nodeDatum.name}
                  </text>
                </g>
              );
            }}
          />
        </div>
      )}

      {selectedNode && (
        <SkillNodeModal
          node={selectedNode}
          status={progressMap[selectedNode._id] ?? "LOCKED"}
          relatedPuzzles={puzzles.filter(
            (p) => p.skillNodeId === selectedNode._id,
          )}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
