// Path: components/player/BrainTree.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";
import { PROGRESS_COLOR } from "./theme";
import type { TreeDatumDTO } from "./api";
import type { ProgressStatus } from "./types";

const Tree = dynamic(() => import("react-d3-tree").then((m) => m.Tree), {
  ssr: false,
});

interface Props {
  data: TreeDatumDTO;
  /** Node ids with an earned badge; they get a star. */
  badgeNodeIds: Set<string>;
  onSelect: (id: string, status: ProgressStatus, isContext: boolean) => void;
}

export default function BrainTree({ data, badgeNodeIds, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 360, height: 480 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const compact = size.width < 500;

  function renderNode({ nodeDatum }: CustomNodeElementProps) {
    const a = (nodeDatum.attributes ?? {}) as Record<
      string,
      string | number | boolean
    >;
    const id = String(a.id ?? "");
    const isModule = a.kind === "module";
    const isContext = a.isContext === true;
    const status = (String(a.status ?? "LOCKED") as ProgressStatus) || "LOCKED";
    const color = isModule ? "#018ABE" : PROGRESS_COLOR[status];
    const mastered = status === "MASTERED" && !isContext;
    const locked = status === "LOCKED";
    const r = isModule ? 18 : 15;
    const label =
      nodeDatum.name.length > 22
        ? `${nodeDatum.name.slice(0, 21)}…`
        : nodeDatum.name;

    return (
      <g
        onClick={() => !isModule && onSelect(id, status, isContext)}
        style={{
          cursor: isModule ? "default" : "pointer",
          opacity: isContext ? 0.35 : locked ? 0.7 : 1,
        }}
        role={isModule ? undefined : "button"}
        aria-label={isModule ? undefined : nodeDatum.name}
      >
        {/* Larger invisible circle makes nodes easy to tap on a phone. */}
        {!isModule && <circle r={26} fill="transparent" stroke="none" />}
        {mastered && (
          <circle r={r + 7} fill={color} opacity={0.25} stroke="none" />
        )}
        <circle
          r={r}
          fill={locked || isContext ? "#0B2133" : color}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={isContext ? "4 3" : undefined}
        />
        {locked && !isContext && !isModule && (
          <path
            d="M-4 -1 v-3 a4 4 0 0 1 8 0 v3 M-6 -1 h12 v8 h-12 z"
            fill="none"
            stroke={color}
            strokeWidth={1.6}
          />
        )}
        {badgeNodeIds.has(id) && (
          <path
            transform={`translate(${r - 2},${-r + 2}) scale(0.55)`}
            d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.4 L6.2 8.5 L0 4.3 L-6.2 8.5 L-4.3 1.4 L-10 -3.1 L-2.9 -3.1 Z"
            fill="#E0A72F"
            stroke="none"
          />
        )}
        <text
          y={isModule ? -28 : r + 17}
          textAnchor="middle"
          fill="#E6F1F7"
          stroke="none"
          style={{
            fontSize: isModule ? 14 : 12,
            fontWeight: isModule || mastered ? 700 : 400,
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
      className="h-[60vh] min-h-[420px] w-full touch-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <Tree
        data={data as unknown as RawNodeDatum}
        orientation="vertical"
        translate={{ x: size.width / 2, y: 60 }}
        zoom={compact ? 0.75 : 1}
        scaleExtent={{ min: 0.4, max: 1.6 }}
        nodeSize={compact ? { x: 130, y: 100 } : { x: 160, y: 110 }}
        separation={{ siblings: 1, nonSiblings: 1.15 }}
        pathFunc="step"
        pathClassFunc={() => "!stroke-white/20"}
        collapsible={false}
        zoomable
        draggable
        renderCustomNodeElement={renderNode}
      />
    </div>
  );
}
