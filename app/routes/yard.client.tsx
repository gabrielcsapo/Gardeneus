"use client";

import React from "react";
import { Link, useNavigate } from "react-router";
import { SHAPE_CONFIG } from "../lib/shapes.ts";
import type { ShapeType } from "../lib/shapes.ts";
import type {
  ToolType,
  Yard,
  YardElement,
  PlantInfo,
  Planting,
} from "../lib/yard-types.ts";
import { CELL_SIZE } from "../lib/yard-types.ts";
import { usePanZoom } from "../lib/use-pan-zoom.ts";
import { useKeyboardShortcuts } from "../lib/use-keyboard-shortcuts.ts";
import { computeSnapGuides } from "../lib/use-snap-guides.ts";
import type { Guide } from "../lib/use-snap-guides.ts";
import {
  addYardElement,
  updateYardElement,
  deleteYardElement,
  duplicateYardElement,
  updateYard,
  deleteYard,
} from "./yard.actions.ts";
import {
  addPlanting,
  updatePlanting,
  deletePlanting,
} from "./beds.$id.actions.ts";
import { rankBedsForPlant, getGlowColor } from "../lib/companion-scoring.ts";
import type { BedScore } from "../lib/companion-scoring.ts";
import { useToast } from "../components/toast.client";
import { useConfirm } from "../components/confirm-dialog.client";
import { ShapeElement } from "../components/yard/shape-element.client.tsx";
import { PropertiesPanel } from "../components/yard/properties-panel.client.tsx";
import { BedPlantingsPanel } from "../components/yard/bed-plantings-panel.client.tsx";
import { BedPlantIcons } from "../components/yard/bed-plant-icons.client.tsx";
import {
  SmartPlacePanel,
  SmartPlaceButton,
} from "../components/yard/smart-place-panel.client.tsx";
import { Toolbar } from "../components/yard/toolbar.client.tsx";
import { ZoomControls } from "../components/yard/zoom-controls.client.tsx";
import { Minimap } from "../components/yard/minimap.client.tsx";
import {
  StatusBar,
  updateCursorDisplay,
} from "../components/yard/status-bar.client.tsx";
import { SnapGuides } from "../components/yard/snap-guides.client.tsx";
import { useTheme } from "../components/theme-provider.client";
import { YardPreview } from "./home.client";

type YardSummary = {
  id: number;
  name: string;
  widthFt: number;
  heightFt: number;
  elements: {
    id: number;
    shapeType: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string | null;
    rotation: number | null;
  }[];
  elementCount: number;
  plantingCount: number;
};

export function YardListPage({
  yards,
  createYardAction,
}: {
  yards: YardSummary[];
  createYardAction: (formData: FormData) => Promise<void>;
}) {
  const [showCreateForm, setShowCreateForm] = React.useState(yards.length === 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Yards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your garden yards and layouts.
          </p>
        </div>
        {yards.length > 0 && !showCreateForm && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-garden-700 transition-colors cursor-pointer"
            onClick={() => setShowCreateForm(true)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Yard
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="max-w-lg mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-garden-50 dark:bg-garden-900/30 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-garden-600 dark:text-garden-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 3v18" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {yards.length === 0 ? "Create Your First Yard" : "Create New Yard"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Define your yard dimensions to start planning your garden layout.
            </p>
            <CreateYardForm action={createYardAction} />
            {yards.length > 0 && (
              <button
                type="button"
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {yards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {yards.map((yard) => (
            <div
              key={yard.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm overflow-hidden group"
            >
              <Link
                to={`/yard/${yard.id}`}
                className="block no-underline hover:shadow-md transition-shadow"
              >
                <div className="p-4 border-b border-earth-100 dark:border-gray-700">
                  <YardPreview
                    widthFt={yard.widthFt}
                    heightFt={yard.heightFt}
                    elements={yard.elements}
                  />
                </div>
                <div className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-garden-700 dark:group-hover:text-garden-400 transition-colors">
                    {yard.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {yard.widthFt} x {yard.heightFt} ft &middot; {yard.elementCount} bed{yard.elementCount !== 1 ? "s" : ""} &middot; {yard.plantingCount} planting{yard.plantingCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

type SizeMode = "dimensions" | "sqft" | "acres";

function sqftToDimensions(sqft: number): { w: number; h: number } {
  const side = Math.round(Math.sqrt(sqft));
  return { w: side, h: side };
}

function acresToDimensions(acres: number): { w: number; h: number } {
  const sqft = acres * 43560;
  const side = Math.round(Math.sqrt(sqft));
  return { w: side, h: side };
}

export function CreateYardForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [sizeMode, setSizeMode] = React.useState<SizeMode>("dimensions");
  const [widthFt, setWidthFt] = React.useState(50);
  const [heightFt, setHeightFt] = React.useState(40);
  const [sqft, setSqft] = React.useState(2000);
  const [acres, setAcres] = React.useState(0.25);

  const effectiveWidth =
    sizeMode === "sqft"
      ? sqftToDimensions(sqft).w
      : sizeMode === "acres"
        ? acresToDimensions(acres).w
        : widthFt;
  const effectiveHeight =
    sizeMode === "sqft"
      ? sqftToDimensions(sqft).h
      : sizeMode === "acres"
        ? acresToDimensions(acres).h
        : heightFt;

  const totalSqft = effectiveWidth * effectiveHeight;
  const totalAcres = (totalSqft / 43560).toFixed(3);

  return (
    <form action={action} className="space-y-4 text-left">
      <input type="hidden" name="widthFt" value={effectiveWidth} />
      <input type="hidden" name="heightFt" value={effectiveHeight} />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Yard Name
        </label>
        <input
          className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
          type="text"
          name="name"
          placeholder="My Backyard"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Size Input
        </label>
        <div className="flex rounded-lg border border-earth-200 dark:border-gray-600 overflow-hidden">
          {(["dimensions", "sqft", "acres"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`flex-1 px-3 py-1.5 text-sm font-medium transition cursor-pointer ${
                sizeMode === mode
                  ? "bg-garden-600 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
              onClick={() => setSizeMode(mode)}
            >
              {mode === "dimensions"
                ? "W x H"
                : mode === "sqft"
                  ? "Sq Feet"
                  : "Acres"}
            </button>
          ))}
        </div>
      </div>

      {sizeMode === "dimensions" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Width (ft)
            </label>
            <input
              className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
              type="number"
              min="10"
              max="1000"
              value={widthFt}
              onChange={(e) => setWidthFt(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Height (ft)
            </label>
            <input
              className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
              type="number"
              min="10"
              max="1000"
              value={heightFt}
              onChange={(e) => setHeightFt(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {sizeMode === "sqft" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Total Square Feet
          </label>
          <input
            className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
            type="number"
            min="100"
            max="500000"
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
          />
        </div>
      )}

      {sizeMode === "acres" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Acres
          </label>
          <input
            className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
            type="number"
            min="0.01"
            max="10"
            step="0.01"
            value={acres}
            onChange={(e) => setAcres(Number(e.target.value))}
          />
        </div>
      )}

      <div className="rounded-lg bg-earth-50 dark:bg-gray-700/50 border border-earth-200 dark:border-gray-600 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
        <p>
          Grid: {effectiveWidth} x {effectiveHeight} ft
        </p>
        <p>
          {totalSqft.toLocaleString()} sq ft ({totalAcres} acres)
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-garden-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-garden-700 transition-colors cursor-pointer"
      >
        Create Yard
      </button>
    </form>
  );
}

function YardSettingsModal({
  yard,
  onClose,
  onSave,
}: {
  yard: Yard;
  onClose: () => void;
  onSave: (updated: { name: string; widthFt: number; heightFt: number }) => void;
}) {
  const [name, setName] = React.useState(yard.name);
  const [widthFt, setWidthFt] = React.useState(yard.widthFt);
  const [heightFt, setHeightFt] = React.useState(yard.heightFt);
  const [saving, setSaving] = React.useState(false);
  const { addToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.set("id", String(yard.id));
    formData.set("name", name);
    formData.set("widthFt", String(widthFt));
    formData.set("heightFt", String(heightFt));
    await updateYard(formData);
    onSave({ name, widthFt, heightFt });
    addToast("Yard updated", "success");
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete yard?",
      message: `"${yard.name}" and all its beds and plantings will be permanently removed.`,
      destructive: true,
    });
    if (!ok) return;
    const formData = new FormData();
    formData.set("id", String(yard.id));
    await deleteYard(formData);
    addToast("Yard deleted", "info");
    navigate("/yard");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yard Settings</h2>
          <button
            type="button"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
            onClick={onClose}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Width (ft)</label>
              <input
                className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
                type="number"
                min="10"
                max="1000"
                value={widthFt}
                onChange={(e) => setWidthFt(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Height (ft)</label>
              <input
                className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
                type="number"
                min="10"
                max="1000"
                value={heightFt}
                onChange={(e) => setHeightFt(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition cursor-pointer"
            onClick={handleDelete}
          >
            Delete Yard
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-white bg-garden-600 hover:bg-garden-700 rounded-lg transition cursor-pointer disabled:opacity-50"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function YardEditor({
  yard: initialYard,
  elements: initialElements,
  plants: allPlants,
  plantings: initialPlantings,
}: {
  yard: Yard;
  elements: YardElement[];
  plants: PlantInfo[];
  plantings: Planting[];
}) {
  const [yard, setYard] = React.useState(initialYard);
  const [showSettings, setShowSettings] = React.useState(false);
  const [elements, setElements] = React.useState(initialElements);
  const [bedPlantings, setBedPlantings] = React.useState(initialPlantings);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [activeTool, setActiveTool] = React.useState<ToolType>("select");
  const [dragPos, setDragPos] = React.useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const [resizePos, setResizePos] = React.useState<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [snapGuides, setSnapGuides] = React.useState<Guide[]>([]);

  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLSpanElement>(null);

  const actionRef = React.useRef<{
    type: "drag" | "pan" | "resize";
    moved: boolean;
    elementId?: number;
    handle?: string;
    startMouseX?: number;
    startMouseY?: number;
    startElX?: number;
    startElY?: number;
    startWidth?: number;
    startHeight?: number;
  } | null>(null);

  const gridWidth = yard.widthFt * CELL_SIZE;
  const gridHeight = yard.heightFt * CELL_SIZE;
  const panZoom = usePanZoom(svgRef, containerRef, gridWidth, gridHeight);
  const { isDark } = useTheme();

  // Grid colors — higher contrast in both modes
  const GRID_COLOR = isDark ? "#374151" : "#d1d5db";
  const GRID_COLOR_MAJOR = isDark ? "#4b5563" : "#9ca3af";
  const GRID_BG = isDark ? "#1f2937" : "#f9fafb";
  const VIEWPORT_BG = isDark ? "#111827" : "#e5e7eb";
  const LABEL_COLOR = isDark ? "#6b7280" : "#6b7280";

  // Undo/redo
  const historyRef = React.useRef<YardElement[][]>([initialElements]);
  const historyIndexRef = React.useRef(0);

  function pushHistory(newElements: YardElement[]) {
    const idx = historyIndexRef.current;
    historyRef.current = [...historyRef.current.slice(0, idx + 1), newElements];
    historyIndexRef.current = idx + 1;
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    setElements(historyRef.current[historyIndexRef.current]);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    setElements(historyRef.current[historyIndexRef.current]);
  }

  function setElementsWithHistory(
    updater: (prev: YardElement[]) => YardElement[],
  ) {
    setElements((prev) => {
      const next = updater(prev);
      pushHistory(next);
      return next;
    });
  }

  // Smart placement
  const [smartPlaceMode, setSmartPlaceMode] = React.useState(false);
  const [smartPlacePlant, setSmartPlacePlant] =
    React.useState<PlantInfo | null>(null);
  const [bedScores, setBedScores] = React.useState<BedScore[]>([]);

  const { addToast } = useToast();
  const confirm = useConfirm();

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  // Companion glow
  React.useEffect(() => {
    if (smartPlacePlant) {
      const scores = rankBedsForPlant(
        smartPlacePlant,
        elements.map((el) => ({ ...el, label: el.label })),
        bedPlantings,
        allPlants,
      );
      setBedScores(scores);
    } else {
      setBedScores([]);
    }
  }, [smartPlacePlant, elements, bedPlantings, allPlants]);

  // --- Action handlers ---

  async function handleDelete(id: number) {
    const el = elements.find((e) => e.id === id);
    const elPlantings = bedPlantings.filter((p) => p.yardElementId === id);
    const label =
      el?.label || SHAPE_CONFIG[el?.shapeType as ShapeType]?.label || "element";
    const msg =
      elPlantings.length > 0
        ? `"${label}" has ${elPlantings.length} planting${elPlantings.length > 1 ? "s" : ""}. All plantings will be removed.`
        : `Remove "${label}" from your yard?`;
    const ok = await confirm({
      title: "Delete bed?",
      message: msg,
      destructive: true,
    });
    if (!ok) return;
    const formData = new FormData();
    formData.set("id", String(id));
    await deleteYardElement(formData);
    setElementsWithHistory((prev) => prev.filter((e) => e.id !== id));
    setSelectedId(null);
    addToast("Element deleted", "info");
  }

  async function handleDuplicate(id: number) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("yardId", String(yard.id));
    await duplicateYardElement(formData);
    const tempId = Date.now();
    const newEl = {
      ...el,
      id: tempId,
      x: Math.min(el.x + 1, yard.widthFt - el.width),
      y: Math.min(el.y + 1, yard.heightFt - el.height),
    };
    setElementsWithHistory((prev) => [...prev, newEl]);
    setSelectedId(tempId);
    addToast("Element duplicated", "success");
  }

  async function handleUpdateElement(
    id: number,
    updates: Record<string, string>,
  ) {
    const formData = new FormData();
    formData.set("id", String(id));
    for (const [k, v] of Object.entries(updates)) {
      formData.set(k, v);
    }
    await updateYardElement(formData);
    setElements((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e };
        if (updates.label !== undefined) updated.label = updates.label;
        if (updates.sunExposure !== undefined)
          updated.sunExposure = updates.sunExposure;
        if (updates.x !== undefined) updated.x = Number(updates.x);
        if (updates.y !== undefined) updated.y = Number(updates.y);
        if (updates.width !== undefined) updated.width = Number(updates.width);
        if (updates.height !== undefined)
          updated.height = Number(updates.height);
        if (updates.rotation !== undefined)
          updated.rotation = Number(updates.rotation);
        return updated;
      }),
    );
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedId,
    elements,
    activeTool,
    setActiveTool,
    setSelectedId,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onMove: (id, dx, dy) => {
      const el = elements.find((e) => e.id === id);
      if (!el) return;
      handleUpdateElement(id, {
        x: String(Math.max(0, el.x + dx)),
        y: String(Math.max(0, el.y + dy)),
      });
    },
    onUndo: undo,
    onRedo: redo,
    onCloseAll: () => {
      setSelectedId(null);
      setActiveTool("select");
      setSmartPlaceMode(false);
      setSmartPlacePlant(null);
    },
  });

  // --- Interaction: find element from click target ---

  function findElementId(target: EventTarget | null): number | null {
    let el = target as Element | null;
    while (el && el !== svgRef.current) {
      const id = el.getAttribute?.("data-element-id");
      if (id) return Number(id);
      el = el.parentElement;
    }
    return null;
  }

  function findResizeHandle(target: EventTarget | null): string | null {
    let el = target as Element | null;
    while (el && el !== svgRef.current) {
      const handle = el.getAttribute?.("data-resize-handle");
      if (handle) return handle;
      el = el.parentElement;
    }
    return null;
  }

  // --- SVG mousedown: start drag or pan ---

  function handleSvgMouseDown(e: React.MouseEvent) {
    // Shape tools use click handler for placement, not mousedown
    if (activeTool !== "select" && activeTool !== "hand") return;

    // Check for resize handle first
    const handleName = findResizeHandle(e.target);
    if (handleName && selectedId && activeTool === "select") {
      const el = elements.find((el) => el.id === selectedId);
      if (!el) return;
      e.preventDefault();
      const coords = panZoom.getSvgCoords(e);
      actionRef.current = {
        type: "resize",
        moved: false,
        elementId: selectedId,
        handle: handleName,
        startMouseX: coords.x,
        startMouseY: coords.y,
        startElX: el.x,
        startElY: el.y,
        startWidth: el.width,
        startHeight: el.height,
      };
      return;
    }

    const elementId = findElementId(e.target);

    if (elementId && activeTool === "select") {
      // Start element drag
      const el = elements.find((el) => el.id === elementId);
      if (!el) return;
      e.preventDefault();
      const coords = panZoom.getSvgCoords(e);
      actionRef.current = {
        type: "drag",
        moved: false,
        elementId,
        startMouseX: coords.x,
        startMouseY: coords.y,
        startElX: el.x,
        startElY: el.y,
      };
    } else {
      // Start pan
      e.preventDefault();
      actionRef.current = { type: "pan", moved: false };
      panZoom.startPan(e);
    }
  }

  // --- Window mousemove/mouseup for drag + pan ---

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      // Always update cursor position display
      if (svgRef.current && cursorRef.current) {
        const coords = panZoom.getSvgCoords(e);
        updateCursorDisplay(cursorRef, coords.x, coords.y);
      }

      const action = actionRef.current;
      if (!action) return;

      if (action.type === "drag") {
        const coords = panZoom.getSvgCoords(e);
        const dx = coords.x - action.startMouseX!;
        const dy = coords.y - action.startMouseY!;

        if (!action.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        action.moved = true;

        const el = elements.find((el) => el.id === action.elementId);
        if (!el) return;

        let newX = Math.max(
          0,
          Math.min(
            yard.widthFt - el.width,
            Math.round(action.startElX! + dx / CELL_SIZE),
          ),
        );
        let newY = Math.max(
          0,
          Math.min(
            yard.heightFt - el.height,
            Math.round(action.startElY! + dy / CELL_SIZE),
          ),
        );

        // Snap alignment guides
        const snap = computeSnapGuides(
          { id: el.id, x: newX, y: newY, width: el.width, height: el.height },
          elements,
        );
        if (snap.snappedX !== null) newX = snap.snappedX;
        if (snap.snappedY !== null) newY = snap.snappedY;
        setSnapGuides(snap.guides);

        setDragPos({ id: action.elementId!, x: newX, y: newY });
      } else if (action.type === "resize") {
        const coords = panZoom.getSvgCoords(e);
        const dx = (coords.x - action.startMouseX!) / CELL_SIZE;
        const dy = (coords.y - action.startMouseY!) / CELL_SIZE;

        if (!action.moved && Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return;
        action.moved = true;

        let newX = action.startElX!;
        let newY = action.startElY!;
        let newW = action.startWidth!;
        let newH = action.startHeight!;
        const handle = action.handle!;

        if (handle.includes("e")) {
          newW = Math.max(1, Math.round(action.startWidth! + dx));
        }
        if (handle.includes("w")) {
          const dxRound = Math.round(dx);
          newX = action.startElX! + dxRound;
          newW = action.startWidth! - dxRound;
          if (newW < 1) {
            newX += newW - 1;
            newW = 1;
          }
        }
        if (handle.includes("s")) {
          newH = Math.max(1, Math.round(action.startHeight! + dy));
        }
        if (handle.includes("n")) {
          const dyRound = Math.round(dy);
          newY = action.startElY! + dyRound;
          newH = action.startHeight! - dyRound;
          if (newH < 1) {
            newY += newH - 1;
            newH = 1;
          }
        }

        // Clamp to yard bounds
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        newW = Math.min(newW, yard.widthFt - newX);
        newH = Math.min(newH, yard.heightFt - newY);
        newW = Math.max(1, newW);
        newH = Math.max(1, newH);

        setResizePos({
          id: action.elementId!,
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      } else if (action.type === "pan") {
        action.moved = true;
        panZoom.onPanMove(e);
      }
    }

    function handleMouseUp() {
      const action = actionRef.current;
      if (!action) return;
      actionRef.current = null;

      if (action.type === "drag") {
        setSnapGuides([]);
        if (action.moved) {
          setDragPos((pos) => {
            if (pos && pos.id === action.elementId) {
              setElements((prev) =>
                prev.map((el) =>
                  el.id === action.elementId
                    ? { ...el, x: pos.x, y: pos.y }
                    : el,
                ),
              );
              const formData = new FormData();
              formData.set("id", String(action.elementId));
              formData.set("x", String(pos.x));
              formData.set("y", String(pos.y));
              updateYardElement(formData);
            }
            return null;
          });
        } else {
          // Click without move = toggle selection
          setSelectedId((prev) =>
            prev === action.elementId ? null : action.elementId!,
          );
        }
      } else if (action.type === "resize") {
        if (action.moved) {
          setResizePos((pos) => {
            if (pos && pos.id === action.elementId) {
              setElements((prev) =>
                prev.map((el) =>
                  el.id === action.elementId
                    ? {
                        ...el,
                        x: pos.x,
                        y: pos.y,
                        width: pos.width,
                        height: pos.height,
                      }
                    : el,
                ),
              );
              const formData = new FormData();
              formData.set("id", String(action.elementId));
              formData.set("x", String(pos.x));
              formData.set("y", String(pos.y));
              formData.set("width", String(pos.width));
              formData.set("height", String(pos.height));
              updateYardElement(formData);
            }
            return null;
          });
        }
      } else if (action.type === "pan") {
        if (!action.moved) {
          // Click on empty space without pan = deselect
          setSelectedId(null);
        }
        panZoom.endPan();
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [elements, yard.widthFt, yard.heightFt, activeTool]);

  // --- Grid click: place element with shape tool ---

  async function handleGridClick(e: React.MouseEvent<SVGSVGElement>) {
    if (activeTool === "select" || activeTool === "hand") return;

    const coords = panZoom.getSvgCoords(e);
    const x = Math.floor(coords.x / CELL_SIZE);
    const y = Math.floor(coords.y / CELL_SIZE);

    const config = SHAPE_CONFIG[activeTool as ShapeType];
    if (!config) return;

    const clampedX = Math.max(
      0,
      Math.min(x, yard.widthFt - config.defaultWidth),
    );
    const clampedY = Math.max(
      0,
      Math.min(y, yard.heightFt - config.defaultHeight),
    );

    const formData = new FormData();
    formData.set("yardId", String(yard.id));
    formData.set("shapeType", activeTool);
    formData.set("x", String(clampedX));
    formData.set("y", String(clampedY));
    formData.set("width", String(config.defaultWidth));
    formData.set("height", String(config.defaultHeight));
    formData.set("label", config.label);
    formData.set("sunExposure", "full_sun");

    const newId = await addYardElement(formData);

    setElementsWithHistory((prev) => [
      ...prev,
      {
        id: newId,
        yardId: yard.id,
        shapeType: activeTool,
        x: clampedX,
        y: clampedY,
        width: config.defaultWidth,
        height: config.defaultHeight,
        label: config.label,
        sunExposure: "full_sun",
        rotation: 0,
        metadata: null,
      },
    ]);
    setSelectedId(newId);
    setActiveTool("select");
  }

  // --- Cursor style ---

  const cursor =
    activeTool === "hand"
      ? "cursor-grab"
      : activeTool !== "select"
        ? "cursor-crosshair"
        : "cursor-default";

  // --- Render ---

  return (
    <div className="h-screen w-full flex overflow-hidden">
    <div
      className="flex-1 h-full overflow-hidden relative"
      ref={containerRef}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={panZoom.viewBox}
        className={cursor}
        onMouseDown={handleSvgMouseDown}
        onClick={handleGridClick}
      >
        <defs>
          <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Viewport background (fills beyond grid) */}
        <rect
          x={panZoom.viewX}
          y={panZoom.viewY}
          width={panZoom.viewWidth}
          height={panZoom.viewHeight}
          fill={VIEWPORT_BG}
        />

        {/* Grid background */}
        <rect width={gridWidth} height={gridHeight} fill={GRID_BG} />

        {/* Grid lines */}
        {Array.from({ length: yard.widthFt + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * CELL_SIZE}
            y1={0}
            x2={i * CELL_SIZE}
            y2={gridHeight}
            stroke={i % 5 === 0 ? GRID_COLOR_MAJOR : GRID_COLOR}
            strokeWidth={i % 5 === 0 ? 1 : 0.5}
          />
        ))}
        {Array.from({ length: yard.heightFt + 1 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * CELL_SIZE}
            x2={gridWidth}
            y2={i * CELL_SIZE}
            stroke={i % 5 === 0 ? GRID_COLOR_MAJOR : GRID_COLOR}
            strokeWidth={i % 5 === 0 ? 1 : 0.5}
          />
        ))}

        {/* Grid labels */}
        {Array.from({ length: Math.floor(yard.widthFt / 5) + 1 }, (_, i) => (
          <text
            key={`lx-${i}`}
            x={i * 5 * CELL_SIZE + 2}
            y={10}
            fontSize="8"
            fill={LABEL_COLOR}
          >
            {i * 5}ft
          </text>
        ))}
        {Array.from({ length: Math.floor(yard.heightFt / 5) + 1 }, (_, i) => (
          <text
            key={`ly-${i}`}
            x={2}
            y={i * 5 * CELL_SIZE + 10}
            fontSize="8"
            fill={LABEL_COLOR}
          >
            {i * 5}
          </text>
        ))}

        {/* Yard elements */}
        {elements.map((el) => {
          const pos = dragPos?.id === el.id ? dragPos : null;
          const rPos = resizePos?.id === el.id ? resizePos : null;
          const displayEl = rPos
            ? {
                ...el,
                x: rPos.x,
                y: rPos.y,
                width: rPos.width,
                height: rPos.height,
              }
            : pos
              ? { ...el, x: pos.x, y: pos.y }
              : el;
          const bedScore = bedScores.find((s) => s.bedId === el.id);
          const glowColor = bedScore ? getGlowColor(bedScore) : null;
          const elPlantings = bedPlantings.filter(
            (p) => p.yardElementId === el.id,
          );
          return (
            <React.Fragment key={el.id}>
              <ShapeElement
                element={displayEl}
                isSelected={el.id === selectedId}
                isDragging={pos !== null}
                onMouseDown={() => {}}
                glowColor={glowColor}
              />
              {elPlantings.length > 0 && (
                <BedPlantIcons
                  element={displayEl}
                  plantings={elPlantings}
                  plants={allPlants}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Snap alignment guides */}
        <SnapGuides guides={snapGuides} />

        {/* Resize handles on selected element */}
        {selected &&
          activeTool === "select" &&
          !dragPos &&
          (() => {
            const el =
              resizePos?.id === selected.id
                ? {
                    ...selected,
                    x: resizePos.x,
                    y: resizePos.y,
                    width: resizePos.width,
                    height: resizePos.height,
                  }
                : selected;
            const x = el.x * CELL_SIZE;
            const y = el.y * CELL_SIZE;
            const w = el.width * CELL_SIZE;
            const h = el.height * CELL_SIZE;
            const hs = CELL_SIZE; // visible handle size (half a grid cell)
            const hit = CELL_SIZE; // invisible hit area (full grid cell)
            const handles = [
              { name: "nw", cx: x, cy: y },
              { name: "n", cx: x + w / 2, cy: y },
              { name: "ne", cx: x + w, cy: y },
              { name: "e", cx: x + w, cy: y + h / 2 },
              { name: "se", cx: x + w, cy: y + h },
              { name: "s", cx: x + w / 2, cy: y + h },
              { name: "sw", cx: x, cy: y + h },
              { name: "w", cx: x, cy: y + h / 2 },
            ];
            const cursorMap: Record<string, string> = {
              nw: "nwse-resize",
              ne: "nesw-resize",
              sw: "nesw-resize",
              se: "nwse-resize",
              n: "ns-resize",
              s: "ns-resize",
              e: "ew-resize",
              w: "ew-resize",
            };
            return (
              <g>
                {handles.map((handle) => (
                  <g
                    key={handle.name}
                    data-resize-handle={handle.name}
                    style={{ cursor: cursorMap[handle.name] }}
                  >
                    {/* Invisible hit area */}
                    <rect
                      x={handle.cx - hit / 2}
                      y={handle.cy - hit / 2}
                      width={hit}
                      height={hit}
                      fill="transparent"
                    />
                    {/* Visible handle */}
                    <rect
                      x={handle.cx - hs / 2}
                      y={handle.cy - hs / 2}
                      width={hs}
                      height={hs}
                      fill={isDark ? "#1f2937" : "white"}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      rx={2}
                      pointerEvents="none"
                    />
                  </g>
                ))}
              </g>
            );
          })()}
      </svg>

      {/* Vertical toolbar — left edge */}
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} onSettings={() => setShowSettings(true)} />

      {/* Zoom controls — top right */}
      <ZoomControls
        zoom={panZoom.zoom}
        onZoomIn={() => panZoom.setZoom(Math.min(5, panZoom.zoom * 1.25))}
        onZoomOut={() => panZoom.setZoom(panZoom.zoom / 1.25)}
        onFitView={panZoom.fitToView}
        onFillView={panZoom.fillView}
      />

      {/* Status bar — bottom */}
      <StatusBar
        cursorRef={cursorRef}
        selectedElement={selected}
        zoom={panZoom.zoom}
        yard={yard}
        onSettings={() => setShowSettings(true)}
      />

      {/* Minimap — bottom corner */}
      <Minimap
        yard={yard}
        elements={elements}
        viewX={panZoom.viewX}
        viewY={panZoom.viewY}
        viewWidth={panZoom.viewWidth}
        viewHeight={panZoom.viewHeight}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        onNavigate={panZoom.setView}
        panelOpen={!!selected}
      />

      {/* Smart place — bottom right */}
      <div className="absolute bottom-8 right-3 z-10">
        {smartPlaceMode ? (
          <SmartPlacePanel
            allPlants={allPlants}
            bedScores={bedScores}
            smartPlacePlant={smartPlacePlant}
            onSelectPlant={(plant) => setSmartPlacePlant(plant)}
            onSelectBed={(bedId) => {
              setSelectedId(bedId);
              setSmartPlaceMode(false);
              setSmartPlacePlant(null);
            }}
            onClose={() => {
              setSmartPlaceMode(false);
              setSmartPlacePlant(null);
            }}
          />
        ) : (
          !selected && (
            <SmartPlaceButton onClick={() => setSmartPlaceMode(true)} />
          )
        )}
      </div>

      {/* Yard settings modal */}
      {showSettings && (
        <YardSettingsModal
          yard={yard}
          onClose={() => setShowSettings(false)}
          onSave={(updated) => setYard((prev) => ({ ...prev, ...updated }))}
        />
      )}
    </div>

      {/* Properties + plantings panel — fixed right sidebar */}
      {selected && (() => {
        const config = SHAPE_CONFIG[selected.shapeType as ShapeType] ?? SHAPE_CONFIG.rectangle;
        const isPlantable = config.plantable ?? false;
        return (
        <div className="w-72 h-full border-l border-earth-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto shrink-0 flex flex-col">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-earth-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: config.color, border: `1px solid ${config.borderColor}` }}
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {selected.label || config.label}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition cursor-pointer"
                title="Delete element"
                onClick={() => handleDelete(selected.id)}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                onClick={() => setSelectedId(null)}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Plantings section */}
          {isPlantable && (
            <div className="px-4 py-3">
              <BedPlantingsPanel
                element={selected}
                plants={allPlants}
                plantings={bedPlantings.filter(
                  (p) => p.yardElementId === selected.id,
                )}
                onAddPlanting={async (plantId, quantity) => {
                  const formData = new FormData();
                  formData.set("plantId", String(plantId));
                  formData.set("yardElementId", String(selected.id));
                  formData.set("quantity", String(quantity));
                  formData.set("status", "planned");
                  await addPlanting(formData);
                  const tempId = Date.now();
                  setBedPlantings((prev) => [
                    ...prev,
                    {
                      id: tempId,
                      plantId,
                      yardElementId: selected.id,
                      status: "planned",
                      quantity,
                      notes: null,
                      plantedDate: null,
                    },
                  ]);
                }}
                onUpdatePlanting={async (plantingId, updates) => {
                  const formData = new FormData();
                  formData.set("id", String(plantingId));
                  if (updates.status != null)
                    formData.set("status", updates.status);
                  if (updates.quantity != null)
                    formData.set("quantity", String(updates.quantity));
                  if (updates.notes != null)
                    formData.set("notes", updates.notes ?? "");
                  await updatePlanting(formData);
                  setBedPlantings((prev) =>
                    prev.map((p) =>
                      p.id === plantingId ? { ...p, ...updates } : p,
                    ),
                  );
                }}
                onDeletePlanting={async (plantingId) => {
                  const ok = await confirm({
                    title: "Remove planting?",
                    message: "This cannot be undone.",
                    destructive: true,
                  });
                  if (!ok) return;
                  const formData = new FormData();
                  formData.set("id", String(plantingId));
                  await deletePlanting(formData);
                  setBedPlantings((prev) =>
                    prev.filter((p) => p.id !== plantingId),
                  );
                }}
              />
            </div>
          )}

          {/* Bed details section */}
          <div className="border-t border-earth-200 dark:border-gray-700 px-4 py-3">
            <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Bed Details</h3>
            <PropertiesPanel
              element={selected}
              onUpdate={(updates) => handleUpdateElement(selected.id, updates)}
            />
          </div>
        </div>
        );
      })()}
    </div>
  );
}
