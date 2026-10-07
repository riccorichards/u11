// Path: components/admin/SkillTreePreview.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";
import { POSITION_COLOR, PROGRESS_STATUS, Position } from "./ui";
import type { TreeDatumDTO } from "./useAdminData";

const Tree = dynamic(() => import("react-d3-tree").then((m) => m.Tree), {
  ssr: false,
});

interface Props {
  data: TreeDatumDTO;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** When true, nodes are colored by the previewed player's status. */
  showStatus: boolean;
}

function nodeColor(
  attrs: Record<string, string | number | boolean>,
  showStatus: boolean,
): string {
  if (attrs.kind === "module") return "#018ABE";
  if (showStatus)
    return (
      PROGRESS_STATUS[String(attrs.status ?? "LOCKED")]?.color ?? "#4A5D6B"
    );
  const positions = String(attrs.positions ?? "ALL").split(",");
  return positions.length === 1 && positions[0] !== "ALL"
    ? POSITION_COLOR[positions[0] as Position]
    : "#8FB8CC";
}

export default function SkillTreePreview({
  data,
  selectedId,
  onSelect,
  showStatus,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  function renderNode({ nodeDatum }: CustomNodeElementProps) {
    const attrs = (nodeDatum.attributes ?? {}) as Record<
      string,
      string | number | boolean
    >;
    const id = String(attrs.id ?? "");
    const isModule = attrs.kind === "module";
    const isContext = attrs.isContext === true;
    const selected = id === selectedId;
    const color = nodeColor(attrs, showStatus);
    const label =
      nodeDatum.name.length > 26
        ? `${nodeDatum.name.slice(0, 25)}…`
        : nodeDatum.name;

    return (
      <g
        onClick={() => onSelect(isModule ? null : id)}
        style={{
          cursor: isModule ? "default" : "pointer",
          opacity: isContext ? 0.45 : 1,
        }}
        role={isModule ? undefined : "button"}
        aria-label={isModule ? undefined : `Select ${nodeDatum.name}`}
      >
        {selected && (
          <circle r={20} fill="none" stroke="#E6F1F7" strokeWidth={2} />
        )}
        <circle
          r={isModule ? 16 : 13}
          fill={isContext ? "transparent" : color}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={isContext ? "4 3" : undefined}
        />
        {attrs.hasLesson === true && (
          <circle r={3.5} cx={10} cy={-10} fill="#E6F1F7" />
        )}
        <text
          y={isModule ? -26 : 30}
          textAnchor="middle"
          fill="#E6F1F7"
          stroke="none"
          style={{
            fontSize: isModule ? 14 : 12,
            fontWeight: isModule ? 700 : 400,
          }}
        >
          {label}
        </text>
      </g>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="h-[520px] w-full overflow-hidden rounded-lg border border-sky/10 bg-white/[0.02]"
    >
      <Tree
        data={data as unknown as RawNodeDatum}
        orientation="vertical"
        translate={{ x: width / 2, y: 60 }}
        nodeSize={{ x: 170, y: 110 }}
        separation={{ siblings: 1, nonSiblings: 1.15 }}
        pathFunc="step"
        pathClassFunc={() => "!stroke-sky/30"}
        collapsible={false}
        zoomable
        renderCustomNodeElement={renderNode}
      />
    </div>
  );
}
