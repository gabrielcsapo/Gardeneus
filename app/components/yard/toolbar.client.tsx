"use client";

import React from "react";
import { SHAPE_TYPES, SHAPE_CONFIG } from "../../lib/shapes.ts";
import type { ShapeType } from "../../lib/shapes.ts";
import type { ToolType } from "../../lib/yard-types.ts";

/* ── Shape icons ── */

const SHAPE_ICONS: Record<ShapeType, React.ReactNode> = {
  rectangle: (
    // Raised bed with plank sides
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="10" rx="1" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <path d="M7 8V6M17 8V6" />
    </svg>
  ),
  circle: (
    // Circle bed
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" strokeDasharray="2 2" />
    </svg>
  ),
  keyhole: (
    // Circle with notch cut out at bottom
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 0 1 6.36 15.36L14 14v7h-4v-7l-4.36 4.36A9 9 0 0 1 12 3z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  ),
  spiral: (
    // Spiral shape
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 12m-2 0a2 2 0 1 0 4 0M12 14a4 4 0 0 0 4-4 4 4 0 0 0-4-4 4 4 0 0 0-4 4M8 12a6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6M6 12a8 8 0 0 0 8 8" />
    </svg>
  ),
  hugelkultur: (
    // Mound shape
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18c0 0 4-12 10-12s10 12 10 12" />
      <path d="M8 16c1-3 2.5-5 4-5s3 2 4 5" strokeDasharray="2 2" />
      <line x1="12" y1="10" x2="12" y2="6" />
      <path d="M10 7l2-1 2 1" />
    </svg>
  ),
  mandala: (
    // Circular with petal-like inner pattern
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="21" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="9.9" y2="9.9" />
      <line x1="14.1" y1="14.1" x2="18.4" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="14.1" y2="9.9" />
      <line x1="9.9" y1="14.1" x2="5.6" y2="18.4" />
    </svg>
  ),
  container: (
    // Pot / container
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14" />
      <path d="M6 7l1.5 13h9L18 7" />
      <path d="M4 4h16v3H4z" />
    </svg>
  ),
  path: (
    // Stepping stones
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="6" height="4" rx="1" />
      <rect x="10" y="9" width="6" height="4" rx="1" />
      <rect x="6" y="16" width="6" height="4" rx="1" />
    </svg>
  ),
  structure: (
    // House/shed outline
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V10l9-7 9 7v11" />
      <rect x="9" y="14" width="6" height="7" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  ),
  water: (
    // Water droplet
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-7 8.5-7 13a7 7 0 0 0 14 0c0-4.5-7-13-7-13z" />
      <path d="M9.5 16a3 3 0 0 0 3 2.5" strokeDasharray="2 2" />
    </svg>
  ),
};

/* ── Buttons ── */

function ToolButton({
  active,
  expanded,
  onClick,
  title,
  label,
  children,
}: {
  active: boolean;
  expanded: boolean;
  onClick: () => void;
  title: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`group relative rounded-md flex items-center transition cursor-pointer ${
        expanded ? "h-9 px-2 gap-2" : "w-10 h-10 justify-center"
      } ${
        active
          ? "bg-garden-50 ring-1 ring-garden-500 text-garden-700 dark:bg-garden-900/40 dark:ring-garden-400 dark:text-garden-400"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      }`}
      onClick={onClick}
      title={title}
    >
      {children}
      {expanded && label && (
        <span className="text-xs font-medium whitespace-nowrap pr-1">{label}</span>
      )}
      {!expanded && (
        <span className="absolute left-full ml-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
          {title}
        </span>
      )}
    </button>
  );
}

/* ── Toolbar ── */

export function Toolbar({
  activeTool,
  onToolChange,
  onSettings,
}: {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onSettings: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-earth-200 dark:border-gray-700 shadow-md p-1.5 transition-all ${expanded ? "min-w-[160px]" : ""}`}>
      {/* Expand / collapse toggle */}
      <button
        type="button"
        className="w-full h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setExpanded((v) => !v)}
        title={expanded ? "Collapse toolbar" : "Expand toolbar"}
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={expanded ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
        </svg>
      </button>

      <div className="h-px bg-earth-200 dark:bg-gray-600 my-0.5" />

      {/* Select tool */}
      <ToolButton
        active={activeTool === "select"}
        expanded={expanded}
        onClick={() => onToolChange("select")}
        title="Select (V)"
        label="Select"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
      </ToolButton>

      {/* Hand/pan tool */}
      <ToolButton
        active={activeTool === "hand"}
        expanded={expanded}
        onClick={() => onToolChange("hand")}
        title="Hand (H)"
        label="Hand"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      </ToolButton>

      <div className="h-px bg-earth-200 dark:bg-gray-600 my-0.5" />

      {/* Shape tools */}
      {SHAPE_TYPES.map((type, i) => {
        const config = SHAPE_CONFIG[type];
        const shortcut = i === 9 ? "0" : String(i + 1);
        return (
          <ToolButton
            key={type}
            active={activeTool === type}
            expanded={expanded}
            onClick={() => onToolChange(activeTool === type ? "select" : type)}
            title={`${config.label} (${shortcut})`}
            label={config.label}
          >
            <span className="relative shrink-0 w-5 h-5 flex items-center justify-center" style={{ color: config.borderColor }}>
              {SHAPE_ICONS[type]}
            </span>
          </ToolButton>
        );
      })}

      <div className="h-px bg-earth-200 dark:bg-gray-600 my-0.5" />

      {/* Yard settings */}
      <ToolButton
        active={false}
        expanded={expanded}
        onClick={onSettings}
        title="Yard Settings"
        label="Settings"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        </svg>
      </ToolButton>
    </div>
  );
}
