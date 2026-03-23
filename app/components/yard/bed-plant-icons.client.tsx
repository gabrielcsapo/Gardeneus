"use client";

import React from "react";
import { SHAPE_CONFIG } from "../../lib/shapes.ts";
import type { ShapeType } from "../../lib/shapes.ts";
import type { YardElement, PlantInfo, Planting } from "../../lib/yard-types.ts";
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

// Distinct, bright colors that stand out against any bed fill color
export const PLANT_PALETTE = [
  "#16a34a", // green-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#db2777", // pink-600
  "#ea580c", // orange-600
  "#0d9488", // teal-600
];

type PlantSlot = {
  plantName: string;
  plantId: number;
  quantity: number;
  spacingInches: number;
  colorIdx: number;
  initial: string;
};

function aggregatePlantings(
  plantings: Planting[],
  plants: PlantInfo[],
): PlantSlot[] {
  const map = new Map<number, PlantSlot>();
  let colorIdx = 0;
  for (const p of plantings) {
    const existing = map.get(p.plantId);
    if (existing) {
      existing.quantity += p.quantity ?? 1;
    } else {
      const plant = plants.find((pl) => pl.id === p.plantId);
      if (!plant) continue;
      map.set(p.plantId, {
        plantName: plant.name,
        plantId: plant.id,
        quantity: p.quantity ?? 1,
        spacingInches: plant.spacingInches ?? 12,
        colorIdx: colorIdx % PLANT_PALETTE.length,
        initial: plant.name.charAt(0).toUpperCase(),
      });
      colorIdx++;
    }
  }
  return Array.from(map.values());
}

function getLayoutRegion(
  shapeType: string,
  x: number,
  y: number,
  w: number,
  h: number,
): { lx: number; ly: number; lw: number; lh: number } {
  const isCircular = ["circle", "keyhole", "spiral", "mandala"].includes(
    shapeType,
  );

  if (shapeType === "hugelkultur") {
    return {
      lx: x + w * 0.15,
      ly: y + h * 0.2,
      lw: w * 0.7,
      lh: h * 0.5,
    };
  }

  if (isCircular) {
    // Inscribed rectangle in ellipse at ~80% radius uses most plantable area
    const inset = 0.18;
    return {
      lx: x + w * inset,
      ly: y + h * inset,
      lw: w * (1 - 2 * inset),
      lh: h * (1 - 2 * inset),
    };
  }

  const pad = 8;
  return {
    lx: x + pad,
    ly: y + pad,
    lw: Math.max(0, w - pad * 2),
    lh: Math.max(0, h - pad * 2),
  };
}

type PlantDot = {
  x: number;
  y: number;
  color: string;
  initial: string;
  plantName: string;
};

function computePlantingGrid(
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  slots: PlantSlot[],
): { dots: PlantDot[]; overflow: number } {
  if (regionW <= 0 || regionH <= 0 || slots.length === 0) {
    return { dots: [], overflow: 0 };
  }

  const dots: PlantDot[] = [];
  let totalOverflow = 0;

  // Calculate total weight for proportional vertical allocation
  // cols/rows use fencing formula: n plants need (n-1) * spacing width,
  // so n = floor(width / spacing) + 1
  const slotWeights = slots.map((s) => {
    const spacingPx = Math.max(16, (s.spacingInches / 12) * CELL_SIZE);
    const cols = Math.max(1, Math.floor(regionW / spacingPx) + 1);
    const rowsNeeded = Math.ceil(s.quantity / cols);
    return rowsNeeded * spacingPx;
  });
  const totalWeight = slotWeights.reduce((a, b) => a + b, 0);

  let currentY = regionY;

  for (let si = 0; si < slots.length; si++) {
    const slot = slots[si];
    const color = PLANT_PALETTE[slot.colorIdx];
    const spacingPx = Math.max(16, (slot.spacingInches / 12) * CELL_SIZE);

    // Allocate proportional height, but at least one row
    const allocatedH =
      totalWeight > 0
        ? Math.max(spacingPx, (slotWeights[si] / totalWeight) * regionH)
        : regionH / slots.length;

    const sectionH = Math.min(allocatedH, regionY + regionH - currentY);
    if (sectionH < spacingPx * 0.5) {
      totalOverflow += slot.quantity;
      continue;
    }

    // Fencing: n plants across need (n-1) gaps, so n = floor(W / spacing) + 1
    const cols = Math.max(1, Math.floor(regionW / spacingPx) + 1);
    const rows = Math.max(1, Math.floor(sectionH / spacingPx) + 1);
    // Grid span is (n-1) * spacing, centered within the section
    const gridW = (cols - 1) * spacingPx;
    const gridH = (rows - 1) * spacingPx;
    const offsetX = regionX + (regionW - gridW) / 2;
    const offsetY = currentY + (sectionH - gridH) / 2;

    let placed = 0;
    for (let row = 0; row < rows && placed < slot.quantity; row++) {
      // Stagger odd rows for hex-like packing
      const stagger = row % 2 === 1 ? spacingPx * 0.3 : 0;
      for (let col = 0; col < cols && placed < slot.quantity; col++) {
        const px = offsetX + col * spacingPx + stagger;
        const py = offsetY + row * spacingPx;

        // Make sure dot is within region
        if (px < regionX || px > regionX + regionW) continue;
        if (py < regionY || py > regionY + regionH) continue;

        dots.push({
          x: px,
          y: py,
          color,
          initial: slot.initial,
          plantName: slot.plantName,
        });
        placed++;
      }
    }

    if (placed < slot.quantity) {
      totalOverflow += slot.quantity - placed;
    }

    currentY += sectionH;
  }

  return { dots, overflow: totalOverflow };
}

export const BedPlantIcons = React.memo(function BedPlantIcons({
  element,
  plantings,
  plants,
}: {
  element: YardElement;
  plantings: Planting[];
  plants: PlantInfo[];
}) {
  const config = SHAPE_CONFIG[element.shapeType as ShapeType];
  if (!config?.plantable) return null;
  if (plantings.length === 0) return null;

  const isDark = useIsDark();

  const x = element.x * CELL_SIZE;
  const y = element.y * CELL_SIZE;
  const w = element.width * CELL_SIZE;
  const h = element.height * CELL_SIZE;
  const minDim = Math.min(w, h);

  if (minDim < 30) return null;

  const rotation = element.rotation ?? 0;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const slots = aggregatePlantings(plantings, plants);
  if (slots.length === 0) return null;

  const outlineColor = isDark ? "#1f2937" : "#ffffff";

  // Very tiny bed — show colored summary dots
  if (minDim < 70) {
    const dotR = 5;
    const totalDots = Math.min(slots.length, 4);
    const totalW = totalDots * (dotR * 2 + 3) - 3;
    const startX = cx - totalW / 2;

    return (
      <g
        pointerEvents="none"
        transform={
          rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined
        }
      >
        {slots.slice(0, totalDots).map((slot, i) => (
          <circle
            key={slot.plantId}
            cx={startX + i * (dotR * 2 + 3) + dotR}
            cy={cy + 10}
            r={dotR}
            fill={PLANT_PALETTE[slot.colorIdx]}
            stroke={outlineColor}
            strokeWidth={1.5}
            opacity={0.9}
          />
        ))}
        {slots.length > totalDots && (
          <text
            x={cx + totalW / 2 + 6}
            y={cy + 13}
            fontSize={8}
            fill={isDark ? "#9ca3af" : "#6b7280"}
            fontWeight="600"
            textAnchor="start"
          >
            +{slots.length - totalDots}
          </text>
        )}
      </g>
    );
  }

  // Get layout region for planting dots
  const { lx, ly, lw, lh } = getLayoutRegion(element.shapeType, x, y, w, h);

  // Compute grid across the full layout region
  const { dots: allDots, overflow: gridOverflow } = computePlantingGrid(
    lx,
    ly,
    lw,
    lh,
    slots,
  );

  // Filter dots: remove those overlapping the label or outside circular shapes
  const labelCenterY = y + h / 2;
  const labelExclusion = element.label ? 12 : 0;
  const isCircular = ["circle", "keyhole", "spiral", "mandala"].includes(element.shapeType);
  const dots = allDots.filter((d) => {
    // Skip dots too close to the label text
    if (labelExclusion > 0 && Math.abs(d.y - labelCenterY) < labelExclusion) {
      return false;
    }
    // For circular shapes, check the dot is inside the ellipse
    if (isCircular) {
      const dx = (d.x - cx) / (w / 2);
      const dy = (d.y - cy) / (h / 2);
      if (dx * dx + dy * dy > 0.85) return false; // ~92% radius to keep dots inside visually
    }
    return true;
  });
  const overflow = gridOverflow + (allDots.length - dots.length);

  // Calculate dot radius based on bed size and spacing
  const avgSpacingPx =
    slots.reduce((sum, s) => sum + (s.spacingInches / 12) * CELL_SIZE, 0) /
    slots.length;
  const dotR = Math.max(4, Math.min(14, avgSpacingPx * 0.3));
  const showInitials = dotR >= 8;
  const fontSize = Math.max(6, dotR * 0.9);

  return (
    <g
      pointerEvents="none"
      transform={
        rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined
      }
    >
      {/* Plant position dots */}
      {dots.map((dot, i) => (
        <g key={i}>
          <circle
            cx={dot.x}
            cy={dot.y}
            r={dotR}
            fill={dot.color}
            stroke={outlineColor}
            strokeWidth={1.5}
            opacity={0.85}
          />
          {showInitials && (
            <text
              x={dot.x}
              y={dot.y + fontSize * 0.35}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#ffffff"
              fontWeight="700"
              opacity={0.95}
            >
              {dot.initial}
            </text>
          )}
        </g>
      ))}

      {/* Overflow indicator */}
      {overflow > 0 && (
        <g>
          <rect
            x={lx + lw - 28}
            y={ly + lh - 14}
            width={26}
            height={13}
            rx={6}
            fill={isDark ? "#374151" : "#ffffff"}
            stroke={isDark ? "#6b7280" : "#d1d5db"}
            strokeWidth={0.5}
            opacity={0.9}
          />
          <text
            x={lx + lw - 15}
            y={ly + lh - 5}
            textAnchor="middle"
            fontSize={8}
            fill={isDark ? "#d1d5db" : "#374151"}
            fontWeight="600"
          >
            +{overflow}
          </text>
        </g>
      )}

      {/* Legend strip at bottom of bed for multiple plant types */}
      {slots.length > 1 && minDim >= 120 && (
        <g>
          {slots.map((slot, i) => {
            const legendX = lx + 4;
            const legendY = ly + lh + 2 - (slots.length - i) * 11;
            if (legendY < ly) return null;
            return (
              <g key={slot.plantId}>
                <circle
                  cx={legendX + 4}
                  cy={legendY}
                  r={3.5}
                  fill={PLANT_PALETTE[slot.colorIdx]}
                  stroke={outlineColor}
                  strokeWidth={1}
                  opacity={0.9}
                />
                <text
                  x={legendX + 10}
                  y={legendY + 3}
                  fontSize={7}
                  fill={isDark ? "#d1d5db" : "#374151"}
                  fontWeight="500"
                  opacity={0.8}
                >
                  {slot.plantName} x{slot.quantity}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
});
