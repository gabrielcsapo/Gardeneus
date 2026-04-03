"use client";

import React from "react";
import { SHAPE_CONFIG } from "../../lib/shapes.ts";
import type { ShapeType } from "../../lib/shapes.ts";
import type { Yard, YardElement } from "../../lib/yard-types.ts";
import { CELL_SIZE } from "../../lib/yard-types.ts";
function useIsDark() {
  const [isDark, setIsDark] = React.useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export function Minimap({
  yard,
  elements,
  viewX,
  viewY,
  viewWidth: vpW,
  viewHeight: vpH,
  gridWidth,
  gridHeight,
  onNavigate,
}: {
  yard: Yard;
  elements: YardElement[];
  viewX: number;
  viewY: number;
  viewWidth: number;
  viewHeight: number;
  gridWidth: number;
  gridHeight: number;
  onNavigate: (viewX: number, viewY: number) => void;
}) {
  const isDark = useIsDark();
  const minimapWidth = 160;
  const minimapHeight = minimapWidth * (yard.heightFt / yard.widthFt);

  function handleClick(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / minimapWidth) * gridWidth;
    const clickY = ((e.clientY - rect.top) / minimapHeight) * gridHeight;
    onNavigate(clickX - vpW / 2, clickY - vpH / 2);
  }

  return (
    <div
      className="absolute bottom-8 right-2 z-20 rounded-lg border border-earth-200 dark:border-gray-700 shadow-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden cursor-pointer"
      onMouseDown={(e) => {
        e.preventDefault();
        handleClick(e);
      }}
      onMouseMove={(e) => {
        if (e.buttons === 1) handleClick(e);
      }}
    >
      <svg
        width={minimapWidth}
        height={minimapHeight}
        viewBox={`0 0 ${gridWidth} ${gridHeight}`}
      >
        <rect width={gridWidth} height={gridHeight} fill={isDark ? "#1f2937" : "#f9fafb"} />
        {elements.map((el) => {
          const config = SHAPE_CONFIG[el.shapeType as ShapeType];
          return (
            <rect
              key={el.id}
              x={el.x * CELL_SIZE}
              y={el.y * CELL_SIZE}
              width={el.width * CELL_SIZE}
              height={el.height * CELL_SIZE}
              fill={config?.color ?? "#ccc"}
              stroke="none"
            />
          );
        })}
        {/* Viewport indicator */}
        <rect
          x={viewX}
          y={viewY}
          width={vpW}
          height={vpH}
          fill="rgba(37, 99, 235, 0.08)"
          stroke="#2563eb"
          strokeWidth={gridWidth / minimapWidth * 1.5}
        />
      </svg>
    </div>
  );
}
