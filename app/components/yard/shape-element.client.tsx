"use client";

import React from "react";
import { SHAPE_CONFIG } from "../../lib/shapes.ts";
import type { ShapeType } from "../../lib/shapes.ts";
import type { YardElement } from "../../lib/yard-types.ts";
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

function ShapeDetail({ element, x, y, w, h }: { element: YardElement; x: number; y: number; w: number; h: number }) {
  const config = SHAPE_CONFIG[element.shapeType as ShapeType] ?? SHAPE_CONFIG.rectangle;
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (element.shapeType) {
    case "rectangle":
      // Horizontal soil row lines
      return (
        <g pointerEvents="none" opacity={0.25}>
          {Array.from({ length: Math.max(0, Math.floor(h / CELL_SIZE) - 1) }, (_, i) => (
            <line
              key={i}
              x1={x + 4}
              y1={y + CELL_SIZE * (i + 1)}
              x2={x + w - 4}
              y2={y + CELL_SIZE * (i + 1)}
              stroke={config.borderColor}
              strokeWidth={0.5}
              strokeDasharray="6 4"
            />
          ))}
        </g>
      );

    case "circle":
      // Concentric inner ring
      return (
        <g pointerEvents="none" opacity={0.2}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={w * 0.32}
            ry={h * 0.32}
            fill="none"
            stroke={config.borderColor}
            strokeWidth={0.5}
            strokeDasharray="4 3"
          />
        </g>
      );

    case "spiral":
      // Spiral path
      return (
        <g pointerEvents="none" opacity={0.25}>
          <path
            d={`M ${cx} ${cy + h * 0.05} `
              + `A ${w * 0.08} ${h * 0.08} 0 0 1 ${cx + w * 0.08} ${cy - h * 0.03} `
              + `A ${w * 0.16} ${h * 0.16} 0 0 1 ${cx - w * 0.1} ${cy + h * 0.13} `
              + `A ${w * 0.24} ${h * 0.24} 0 0 1 ${cx + w * 0.2} ${cy - h * 0.15} `
              + `A ${w * 0.32} ${h * 0.32} 0 0 1 ${cx - w * 0.28} ${cy + h * 0.22}`}
            fill="none"
            stroke={config.borderColor}
            strokeWidth={1}
          />
        </g>
      );

    case "hugelkultur":
      // Wavy horizontal lines suggesting buried wood layers
      return (
        <g pointerEvents="none" opacity={0.2}>
          {[0.4, 0.6, 0.8].map((frac) => {
            const ly = y + h * frac;
            const amplitude = w * 0.04;
            return (
              <path
                key={frac}
                d={`M ${x + w * 0.15} ${ly} Q ${x + w * 0.35} ${ly - amplitude}, ${cx} ${ly} Q ${x + w * 0.65} ${ly + amplitude}, ${x + w * 0.85} ${ly}`}
                fill="none"
                stroke={config.borderColor}
                strokeWidth={0.7}
              />
            );
          })}
        </g>
      );

    case "mandala":
      // Radial dividing lines (pie segments)
      return (
        <g pointerEvents="none" opacity={0.15}>
          {[0, 45, 90, 135].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const r = Math.min(w, h) * 0.45;
            return (
              <line
                key={angle}
                x1={cx - Math.cos(rad) * r}
                y1={cy - Math.sin(rad) * r}
                x2={cx + Math.cos(rad) * r}
                y2={cy + Math.sin(rad) * r}
                stroke={config.borderColor}
                strokeWidth={0.5}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.15} fill="none" stroke={config.borderColor} strokeWidth={0.5} />
        </g>
      );

    case "container":
      // Rim/lip at top
      return (
        <g pointerEvents="none" opacity={0.3}>
          <rect
            x={x - 1}
            y={y}
            width={w + 2}
            height={Math.min(4, h * 0.15)}
            rx={4}
            fill={config.borderColor}
            opacity={0.25}
          />
        </g>
      );

    case "path":
      // Stepping stone pattern
      return (
        <g pointerEvents="none" opacity={0.2}>
          {Array.from({ length: Math.max(0, Math.floor(Math.max(w, h) / CELL_SIZE / 1.5)) }, (_, i) => {
            const isVertical = h > w;
            const stoneX = isVertical ? cx : x + CELL_SIZE * 1.5 * (i + 0.5);
            const stoneY = isVertical ? y + CELL_SIZE * 1.5 * (i + 0.5) : cy;
            const stoneW = isVertical ? w * 0.45 : CELL_SIZE * 0.8;
            const stoneH = isVertical ? CELL_SIZE * 0.8 : h * 0.45;
            if (stoneX - stoneW / 2 < x || stoneX + stoneW / 2 > x + w) return null;
            if (stoneY - stoneH / 2 < y || stoneY + stoneH / 2 > y + h) return null;
            return (
              <rect
                key={i}
                x={stoneX - stoneW / 2}
                y={stoneY - stoneH / 2}
                width={stoneW}
                height={stoneH}
                rx={3}
                fill={config.borderColor}
                opacity={0.3}
              />
            );
          })}
        </g>
      );

    case "structure":
      // Cross-hatch pattern
      return (
        <g pointerEvents="none" opacity={0.12}>
          {Array.from({ length: Math.floor(w / CELL_SIZE) }, (_, i) => (
            <line
              key={`d1-${i}`}
              x1={x + CELL_SIZE * (i + 1)}
              y1={y}
              x2={x + CELL_SIZE * (i + 1)}
              y2={y + h}
              stroke={config.borderColor}
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: Math.floor(h / CELL_SIZE) }, (_, i) => (
            <line
              key={`d2-${i}`}
              x1={x}
              y1={y + CELL_SIZE * (i + 1)}
              x2={x + w}
              y2={y + CELL_SIZE * (i + 1)}
              stroke={config.borderColor}
              strokeWidth={0.5}
            />
          ))}
        </g>
      );

    case "water":
      // Concentric ripple circles
      return (
        <g pointerEvents="none" opacity={0.3}>
          <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.25} fill="none" stroke="#3b82f6" strokeWidth={0.5} />
          <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.4} fill="none" stroke="#3b82f6" strokeWidth={0.4} />
          <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.12} fill="#3b82f6" opacity={0.5} />
        </g>
      );

    default:
      return null;
  }
}

export function ShapeElement({
  element,
  isSelected,
  isDragging,
  onMouseDown,
  glowColor,
}: {
  element: YardElement;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  glowColor?: string | null;
}) {
  const config = SHAPE_CONFIG[element.shapeType as ShapeType] ?? SHAPE_CONFIG.rectangle;
  const x = element.x * CELL_SIZE;
  const y = element.y * CELL_SIZE;
  const w = element.width * CELL_SIZE;
  const h = element.height * CELL_SIZE;

  const isCircular = ["circle", "keyhole", "spiral", "mandala"].includes(element.shapeType);

  const rotation = element.rotation ?? 0;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const isDark = useIsDark();
  const labelColor = isDark ? "#d1d5db" : "#374151";
  const notchFill = isDark ? "#1f2937" : "#f9fafb";

  return (
    <g
      data-element-id={element.id}
      onMouseDown={onMouseDown}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
      style={{ opacity: isDragging ? 0.7 : 1 }}
      transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
    >
      {isCircular ? (
        <ellipse
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          fill={config.color}
          stroke={isSelected ? "#2563eb" : config.borderColor}
          strokeWidth={isSelected ? 2 : 1}
          opacity={0.85}
        />
      ) : element.shapeType === "hugelkultur" ? (
        <path
          d={`M ${x} ${y + h} Q ${x + w * 0.25} ${y + h * 0.2}, ${x + w / 2} ${y} Q ${x + w * 0.75} ${y + h * 0.2}, ${x + w} ${y + h} Z`}
          fill={config.color}
          stroke={isSelected ? "#2563eb" : config.borderColor}
          strokeWidth={isSelected ? 2 : 1}
          opacity={0.85}
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={element.shapeType === "container" ? 6 : 2}
          fill={config.color}
          stroke={isSelected ? "#2563eb" : config.borderColor}
          strokeWidth={isSelected ? 2 : 1}
          opacity={0.85}
        />
      )}

      {/* Keyhole notch */}
      {element.shapeType === "keyhole" && (
        <>
          <rect
            x={x + w / 2 - CELL_SIZE * 0.5}
            y={y + h / 2}
            width={CELL_SIZE}
            height={h / 2}
            fill={notchFill}
            stroke={config.borderColor}
            strokeWidth={0.5}
          />
          <circle cx={x + w / 2} cy={y + h / 2} r={CELL_SIZE * 0.7} fill="#92400e" opacity={0.3} />
        </>
      )}

      {/* Shape-specific visual details */}
      <ShapeDetail element={element} x={x} y={y} w={w} h={h} />

      {/* Label */}
      {element.label && (
        <text
          x={x + w / 2}
          y={y + h / 2 + (isCircular ? 0 : 4)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(11, w / (element.label.length * 0.7))}
          fill={labelColor}
          fontWeight="500"
          pointerEvents="none"
        >
          {element.label}
        </text>
      )}

      {/* Companion glow */}
      {glowColor && (
        <rect
          x={x - 3}
          y={y - 3}
          width={w + 6}
          height={h + 6}
          fill="none"
          stroke={glowColor}
          strokeWidth={3}
          opacity={0.6}
          rx={6}
          filter="url(#glow-green)"
        />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={x - 2}
          y={y - 2}
          width={w + 4}
          height={h + 4}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1}
          strokeDasharray="4 2"
          rx={4}
        />
      )}
    </g>
  );
}
