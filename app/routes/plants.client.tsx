"use client";

import React from "react";
import { useSearchParams } from "react-flight-router/client";
import { PlantIcon } from "../lib/plant-icons";
import { SlideOverPanel } from "../components/slide-over-panel.client";

type Plant = {
  id: number;
  name: string;
  variety: string | null;
  description: string | null;
  category: string | null;
  family: string | null;
  zoneMin: string | null;
  zoneMax: string | null;
  sunRequirement: string | null;
  daysToHarvest: number | null;
  spacingInches: number | null;
  waterNeeds: string | null;
  frostTolerance: string | null;
  growthHabit: string | null;
  matureHeightInches: number | null;
  rootDepth: string | null;
  expectedYieldPerPlant: number | null;
  expectedYieldUnit: string | null;
  indoorStartWeeksBeforeFrost: number | null;
  directSowWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  companions: string[] | null;
  incompatible: string[] | null;
  commonPests: string[] | null;
  commonDiseases: string[] | null;
  successionIntervalWeeks: number | null;
};

type ActivePlanting = {
  plantId: number;
  plantName: string | null;
  bedLabel: string | null;
  yardElementId: number;
};

const CATEGORY_STYLES: Record<string, string> = {
  vegetable: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30",
  fruit: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-500/30",
  herb: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-500/30",
  legume: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30",
  root: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-500/30",
  leafy_green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30",
  allium: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-500/30",
  brassica: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-500/30",
  flower: "bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-900/30 dark:text-pink-400 dark:ring-pink-500/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  leafy_green: "Leafy Green",
  allium: "Allium",
  brassica: "Brassica",
  vegetable: "Vegetable",
  fruit: "Fruit",
  herb: "Herb",
  legume: "Legume",
  root: "Root",
  flower: "Flower",
};

const SUN_CONFIG: Record<string, { icon: string; label: string }> = {
  full_sun: { icon: "\u2600\uFE0F", label: "Full Sun" },
  partial_shade: { icon: "\u26C5", label: "Partial Shade" },
  full_shade: { icon: "\uD83C\uDF25\uFE0F", label: "Full Shade" },
};

type SortMode = "alpha" | "plant_soon" | "companions";
type ViewMode = "grid" | "list";

const GRID_ROW_HEIGHT = 250;
const LIST_ROW_HEIGHT = 52;

function useGridColumns(): number {
  const [columns, setColumns] = React.useState(1);

  React.useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const update = () => setColumns(lg.matches ? 3 : sm.matches ? 2 : 1);
    update();
    lg.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  return columns;
}

function useVirtualScroll({
  totalCount,
  rowHeight,
  columns,
  overscan = 3,
}: {
  totalCount: number;
  rowHeight: number;
  columns: number;
  overscan?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef(0);
  const totalRows = Math.ceil(totalCount / columns);
  const totalHeight = totalRows * rowHeight;

  const [range, setRange] = React.useState({ startRow: 0, endRow: Math.ceil(20 / columns) });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calculate = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrolled = -rect.top;
      const rows = Math.ceil(totalCount / columns);

      const first = Math.max(0, Math.floor(scrolled / rowHeight));
      const last = Math.min(Math.max(0, rows - 1), Math.ceil((scrolled + vh) / rowHeight));
      const s = Math.max(0, first - overscan);
      const e = Math.min(Math.max(0, rows - 1), last + overscan);

      setRange((prev) => (prev.startRow === s && prev.endRow === e ? prev : { startRow: s, endRow: e }));
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(calculate);
    };

    calculate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [totalCount, rowHeight, columns, overscan]);

  return {
    containerRef,
    startIndex: range.startRow * columns,
    endIndex: Math.min(totalCount, (range.endRow + 1) * columns),
    totalHeight,
    offsetY: range.startRow * rowHeight,
  };
}

export function PlantSearch({
  plants,
  lastFrostDate,
  activePlantings,
}: {
  plants: Plant[];
  lastFrostDate: string | null;
  activePlantings: ActivePlanting[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [sunFilter, setSunFilter] = React.useState("");
  const [sortMode, setSortMode] = React.useState<SortMode>("alpha");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");

  const selectedId = searchParams.get("selected");
  const selectedPlant = selectedId ? plants.find((p) => p.id === Number(selectedId)) : null;

  const setSelectedPlant = (plant: Plant | null) => {
    if (plant) {
      setSearchParams({ selected: String(plant.id) }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    for (const p of plants) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats).sort();
  }, [plants]);

  const sunOptions = React.useMemo(() => {
    const opts = new Set<string>();
    for (const p of plants) {
      if (p.sunRequirement) opts.add(p.sunRequirement);
    }
    return Array.from(opts).sort();
  }, [plants]);

  // Compute companion scores for "Best for Your Beds" sort
  const companionScores = React.useMemo(() => {
    const currentPlantNames = new Set(activePlantings.map((p) => p.plantName).filter(Boolean));
    const scores = new Map<number, number>();
    for (const plant of plants) {
      let score = 0;
      if (plant.companions) {
        for (const c of plant.companions) {
          if (currentPlantNames.has(c)) score += 2;
        }
      }
      if (plant.incompatible) {
        for (const c of plant.incompatible) {
          if (currentPlantNames.has(c)) score -= 3;
        }
      }
      scores.set(plant.id, score);
    }
    return scores;
  }, [plants, activePlantings]);

  // Compute "plant soon" distance (weeks until nearest planting window)
  const plantSoonScores = React.useMemo(() => {
    if (!lastFrostDate) return new Map<number, number>();
    const frost = new Date(lastFrostDate);
    const now = new Date();
    const scores = new Map<number, number>();

    for (const plant of plants) {
      let nearestWeeks = Infinity;
      const windows = [
        plant.indoorStartWeeksBeforeFrost != null ? -plant.indoorStartWeeksBeforeFrost : null,
        plant.directSowWeeksBeforeFrost != null ? -plant.directSowWeeksBeforeFrost : null,
        plant.transplantWeeksAfterFrost != null ? plant.transplantWeeksAfterFrost : null,
      ].filter((w): w is number => w != null);

      for (const weeksFromFrost of windows) {
        const windowDate = new Date(frost);
        windowDate.setDate(windowDate.getDate() + weeksFromFrost * 7);
        const diffWeeks = (windowDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7);
        // Prefer upcoming windows (positive), deprioritize past windows
        const distance = diffWeeks < -4 ? Infinity : Math.abs(diffWeeks);
        nearestWeeks = Math.min(nearestWeeks, distance);
      }
      scores.set(plant.id, nearestWeeks);
    }
    return scores;
  }, [plants, lastFrostDate]);

  const filtered = React.useMemo(() => {
    let result = plants.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.variety && p.variety.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesSun = !sunFilter || p.sunRequirement === sunFilter;
      return matchesSearch && matchesCategory && matchesSun;
    });

    // Sort
    if (sortMode === "plant_soon") {
      result = [...result].sort((a, b) => (plantSoonScores.get(a.id) ?? Infinity) - (plantSoonScores.get(b.id) ?? Infinity));
    } else if (sortMode === "companions") {
      result = [...result].sort((a, b) => (companionScores.get(b.id) ?? 0) - (companionScores.get(a.id) ?? 0));
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [plants, search, categoryFilter, sunFilter, sortMode, plantSoonScores, companionScores]);

  // Current plant's plantings for detail panel
  const selectedPlantPlantings = React.useMemo(() => {
    if (!selectedPlant) return [];
    return activePlantings.filter((p) => p.plantId === selectedPlant.id);
  }, [selectedPlant, activePlantings]);

  // Virtual scroll
  const gridColumns = useGridColumns();
  const vsColumns = viewMode === "grid" ? gridColumns : 1;
  const vsRowHeight = viewMode === "grid" ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;
  const { containerRef, startIndex, endIndex, totalHeight, offsetY } = useVirtualScroll({
    totalCount: filtered.length,
    rowHeight: vsRowHeight,
    columns: vsColumns,
    overscan: viewMode === "grid" ? 3 : 8,
  });

  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
              type="text"
              placeholder="Search plants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] ?? cat}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={sunFilter}
            onChange={(e) => setSunFilter(e.target.value)}
          >
            <option value="">All sun levels</option>
            {sunOptions.map((opt) => (
              <option key={opt} value={opt}>
                {SUN_CONFIG[opt]?.label ?? opt}
              </option>
            ))}
          </select>
        </div>

        {/* Sort + View controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-earth-100 dark:border-gray-700">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">Sort:</span>
            {(
              [
                ["alpha", "A-Z"],
                ["plant_soon", "Plant Soon"],
                ["companions", "Best Companions"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer ${
                  sortMode === mode
                    ? "bg-garden-50 text-garden-700 font-medium dark:bg-garden-900/30 dark:text-garden-400"
                    : "text-gray-500 hover:text-gray-700 hover:bg-earth-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => setSortMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === "grid" ? "bg-earth-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === "list" ? "bg-earth-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {filtered.length} of {plants.length} plants
        </p>
      </div>

      {/* Plant Grid/List (Virtual Scroll) */}
      {filtered.length > 0 ? (
        <div ref={containerRef} style={{ height: totalHeight, position: "relative" }}>
          <div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(startIndex, endIndex).map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    lastFrostDate={lastFrostDate}
                    onClick={() => setSelectedPlant(plant)}
                    isSelected={selectedPlant?.id === plant.id}
                    companionScore={companionScores.get(plant.id) ?? 0}
                    sortMode={sortMode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.slice(startIndex, endIndex).map((plant) => (
                  <PlantListRow
                    key={plant.id}
                    plant={plant}
                    onClick={() => setSelectedPlant(plant)}
                    isSelected={selectedPlant?.id === plant.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No plants match your filters.</p>
        </div>
      )}

      {/* Detail Slide-Over */}
      <SlideOverPanel
        open={!!selectedPlant}
        onClose={() => setSelectedPlant(null)}
        title={selectedPlant?.name ?? ""}
      >
        {selectedPlant && (
          <PlantDetail
            plant={selectedPlant}
            lastFrostDate={lastFrostDate}
            plantings={selectedPlantPlantings}
          />
        )}
      </SlideOverPanel>
    </div>
  );
}

// --- Plant Card (Grid View) ---
function PlantCard({
  plant,
  lastFrostDate,
  onClick,
  isSelected,
  companionScore,
  sortMode,
}: {
  plant: Plant;
  lastFrostDate: string | null;
  onClick: () => void;
  isSelected: boolean;
  companionScore: number;
  sortMode: SortMode;
}) {
  const sun = plant.sunRequirement ? SUN_CONFIG[plant.sunRequirement] : null;
  const catStyle = plant.category
    ? (CATEGORY_STYLES[plant.category] ?? "bg-gray-50 text-gray-700 ring-gray-600/20")
    : null;
  const catLabel = plant.category ? (CATEGORY_LABELS[plant.category] ?? plant.category) : null;

  return (
    <button
      type="button"
      className={`text-left bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-5 flex flex-col gap-3 card-hover cursor-pointer hover:border-garden-300 dark:hover:border-garden-600 ${
        isSelected
          ? "border-garden-500 ring-2 ring-garden-500/20 dark:border-garden-400"
          : "border-earth-200 dark:border-gray-700"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlantIcon name={plant.name} size={28} className="text-garden-600 dark:text-garden-400 shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{plant.name}</h3>
            {plant.variety && <p className="text-xs text-gray-500 dark:text-gray-400">{plant.variety}</p>}
          </div>
        </div>
        {catLabel && (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${catStyle}`}>
            {catLabel}
          </span>
        )}
      </div>

      {plant.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{plant.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {sun && <span>{sun.icon} {sun.label}</span>}
        {plant.daysToHarvest != null && <span>{plant.daysToHarvest}d to harvest</span>}
        {plant.spacingInches != null && <span>{plant.spacingInches}&quot; spacing</span>}
      </div>

      {sortMode === "companions" && companionScore !== 0 && (
        <span className={`text-xs font-medium ${companionScore > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
          {companionScore > 0 ? `+${companionScore} companion match` : `${companionScore} conflict`}
        </span>
      )}

      <PlantingCalendarBar plant={plant} lastFrostDate={lastFrostDate} />
    </button>
  );
}

// --- Plant List Row (List View) ---
function PlantListRow({
  plant,
  onClick,
  isSelected,
}: {
  plant: Plant;
  onClick: () => void;
  isSelected: boolean;
}) {
  const sun = plant.sunRequirement ? SUN_CONFIG[plant.sunRequirement] : null;
  const catStyle = plant.category
    ? (CATEGORY_STYLES[plant.category] ?? "bg-gray-50 text-gray-700 ring-gray-600/20")
    : null;
  const catLabel = plant.category ? (CATEGORY_LABELS[plant.category] ?? plant.category) : null;

  return (
    <button
      type="button"
      className={`text-left w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer hover:bg-earth-50 dark:hover:bg-gray-800 ${
        isSelected ? "bg-garden-50 dark:bg-garden-900/20" : ""
      }`}
      onClick={onClick}
    >
      <PlantIcon name={plant.name} size={24} className="text-garden-600 dark:text-garden-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{plant.name}</span>
        {plant.variety && <span className="text-xs text-gray-400 ml-2">{plant.variety}</span>}
      </div>
      {catLabel && (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset whitespace-nowrap ${catStyle}`}>
          {catLabel}
        </span>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
        {sun && <span>{sun.icon}</span>}
        {plant.daysToHarvest != null && <span>{plant.daysToHarvest}d</span>}
      </div>
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

// --- Plant Detail (Slide-Over Content) ---
function PlantDetail({
  plant,
  lastFrostDate,
  plantings,
}: {
  plant: Plant;
  lastFrostDate: string | null;
  plantings: ActivePlanting[];
}) {
  const sun = plant.sunRequirement ? SUN_CONFIG[plant.sunRequirement] : null;
  const catStyle = plant.category
    ? (CATEGORY_STYLES[plant.category] ?? "bg-gray-50 text-gray-700 ring-gray-600/20")
    : null;
  const catLabel = plant.category ? (CATEGORY_LABELS[plant.category] ?? plant.category) : null;

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PlantIcon name={plant.name} size={40} className="text-garden-600 dark:text-garden-400 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plant.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {plant.variety && <span className="text-sm text-gray-500 dark:text-gray-400">{plant.variety}</span>}
            {catLabel && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${catStyle}`}>
                {catLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {plant.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{plant.description}</p>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        {sun && <StatChip label="Sun" value={`${sun.icon} ${sun.label}`} />}
        {plant.daysToHarvest != null && <StatChip label="Harvest" value={`${plant.daysToHarvest} days`} />}
        {plant.spacingInches != null && <StatChip label="Spacing" value={`${plant.spacingInches}"`} />}
        {plant.waterNeeds && <StatChip label="Water" value={plant.waterNeeds.replace("_", " ")} />}
        {plant.frostTolerance && <StatChip label="Frost" value={plant.frostTolerance.replace("_", " ")} />}
        {plant.family && <StatChip label="Family" value={plant.family} />}
        {plant.growthHabit && <StatChip label="Growth" value={plant.growthHabit.replace("_", " ")} />}
        {plant.rootDepth && <StatChip label="Root" value={plant.rootDepth.replace("_", " ")} />}
        {plant.zoneMin && plant.zoneMax && <StatChip label="Zones" value={`${plant.zoneMin} - ${plant.zoneMax}`} />}
        {plant.expectedYieldPerPlant != null && (
          <StatChip label="Yield" value={`${plant.expectedYieldPerPlant} ${plant.expectedYieldUnit ?? ""}/plant`} />
        )}
        {plant.successionIntervalWeeks != null && (
          <StatChip label="Succession" value={`Every ${plant.successionIntervalWeeks} wks`} />
        )}
      </div>

      {/* Planting Calendar */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Planting Calendar
        </h3>
        <PlantingCalendarBar plant={plant} lastFrostDate={lastFrostDate} />
      </div>

      {/* Currently planted */}
      {plantings.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Currently Planted ({plantings.length})
          </h3>
          <div className="flex flex-col gap-1">
            {plantings.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm px-3 py-2 bg-garden-50 dark:bg-garden-900/20 rounded-lg">
                <svg className="w-3.5 h-3.5 text-garden-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{p.bedLabel ?? `Bed #${p.yardElementId}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Companions */}
      {plant.companions && plant.companions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Companions
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {plant.companions.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 rounded-lg px-2.5 py-1 dark:bg-green-900/30 dark:text-green-400">
                <PlantIcon name={c} size={14} className="text-green-600 dark:text-green-400" />
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Incompatible */}
      {plant.incompatible && plant.incompatible.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Avoid Near
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {plant.incompatible.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-600 rounded-lg px-2.5 py-1 dark:bg-red-900/30 dark:text-red-400">
                <PlantIcon name={c} size={14} className="text-red-500 dark:text-red-400" />
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pest watch */}
      {((plant.commonPests && plant.commonPests.length > 0) ||
        (plant.commonDiseases && plant.commonDiseases.length > 0)) && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Pest &amp; Disease Watch
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {plant.commonPests?.map((pest) => (
              <span key={pest} className="text-xs bg-amber-50 text-amber-700 rounded-lg px-2.5 py-1 dark:bg-amber-900/30 dark:text-amber-400">
                {pest}
              </span>
            ))}
            {plant.commonDiseases?.map((disease) => (
              <span key={disease} className="text-xs bg-orange-50 text-orange-700 rounded-lg px-2.5 py-1 dark:bg-orange-900/30 dark:text-orange-400">
                {disease}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-earth-50 dark:bg-gray-800 rounded-lg px-3 py-2">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-700 dark:text-gray-200 capitalize">{value}</span>
    </div>
  );
}

// --- Planting Calendar Bar ---
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function weeksToYearPercent(frostDate: Date, weeks: number): number {
  const target = new Date(frostDate);
  target.setDate(target.getDate() + weeks * 7);
  const startOfYear = new Date(target.getFullYear(), 0, 1);
  const diffMs = target.getTime() - startOfYear.getTime();
  const dayOfYear = diffMs / (1000 * 60 * 60 * 24);
  return (dayOfYear / 365) * 100;
}

function PlantingCalendarBar({
  plant,
  lastFrostDate,
}: {
  plant: Plant;
  lastFrostDate: string | null;
}) {
  if (!lastFrostDate) {
    return (
      <p className="text-xs text-gray-400 italic">
        Set frost dates in settings to see planting calendar.
      </p>
    );
  }

  const frost = new Date(lastFrostDate);
  const segments: { label: string; color: string; left: number; width: number }[] = [];

  if (plant.indoorStartWeeksBeforeFrost != null) {
    const startPct = weeksToYearPercent(frost, -plant.indoorStartWeeksBeforeFrost);
    const endWeeks = plant.transplantWeeksAfterFrost ?? 0;
    const endPct = weeksToYearPercent(frost, endWeeks);
    const left = Math.max(0, Math.min(100, startPct));
    const right = Math.max(0, Math.min(100, endPct));
    if (right > left) segments.push({ label: "Indoor", color: "bg-blue-400", left, width: right - left });
  }

  if (plant.directSowWeeksBeforeFrost != null) {
    const startPct = weeksToYearPercent(frost, -plant.directSowWeeksBeforeFrost);
    const endPct = weeksToYearPercent(frost, -plant.directSowWeeksBeforeFrost + 4);
    const left = Math.max(0, Math.min(100, startPct));
    const right = Math.max(0, Math.min(100, endPct));
    if (right > left) segments.push({ label: "Direct Sow", color: "bg-emerald-500", left, width: right - left });
  }

  if (plant.transplantWeeksAfterFrost != null) {
    const startPct = weeksToYearPercent(frost, plant.transplantWeeksAfterFrost);
    const endPct = weeksToYearPercent(frost, plant.transplantWeeksAfterFrost + 3);
    const left = Math.max(0, Math.min(100, startPct));
    const right = Math.max(0, Math.min(100, endPct));
    if (right > left) segments.push({ label: "Transplant", color: "bg-orange-400", left, width: right - left });
  }

  if (plant.daysToHarvest != null) {
    let base: number | null = null;
    if (plant.transplantWeeksAfterFrost != null) base = plant.transplantWeeksAfterFrost;
    else if (plant.directSowWeeksBeforeFrost != null) base = -plant.directSowWeeksBeforeFrost;
    if (base != null) {
      const harvestWeeks = base + plant.daysToHarvest / 7;
      const startPct = weeksToYearPercent(frost, harvestWeeks);
      const endPct = weeksToYearPercent(frost, harvestWeeks + 4);
      const left = Math.max(0, Math.min(100, startPct));
      const right = Math.max(0, Math.min(100, endPct));
      if (right > left) segments.push({ label: "Harvest", color: "bg-amber-500", left, width: right - left });
    }
  }

  // Current month indicator
  const now = new Date();
  const currentMonthPct = ((now.getMonth() + now.getDate() / 30) / 12) * 100;

  return (
    <div>
      <div className="relative h-5 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`absolute top-0 h-full ${seg.color} opacity-80 rounded-sm`}
            style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
            title={seg.label}
          />
        ))}
        {/* Current month line */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-900/40 dark:bg-white/40 z-10"
          style={{ left: `${currentMonthPct}%` }}
          title="Today"
        />
        {MONTHS.map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-l border-gray-200 dark:border-gray-600"
            style={{ left: `${(i / 12) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        {MONTHS.map((m) => (
          <span key={m} className="text-[9px] text-gray-400">{m}</span>
        ))}
      </div>
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {segments.map((seg) => (
            <span key={seg.label} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-sm ${seg.color}`} />
              {seg.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlantsPageTabs({
  plantsTab,
  pestsTab,
}: {
  plantsTab: React.ReactNode;
  pestsTab: React.ReactNode;
}) {
  const [active, setActive] = React.useState<"plants" | "pests">("plants");
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-earth-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActive("plants")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            active === "plants"
              ? "border-garden-500 text-garden-700 dark:text-garden-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          Plant Library
        </button>
        <button
          type="button"
          onClick={() => setActive("pests")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            active === "pests"
              ? "border-garden-500 text-garden-700 dark:text-garden-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          Pests & Diseases
        </button>
      </div>
      <div style={{ display: active === "plants" ? undefined : "none" }}>{plantsTab}</div>
      <div style={{ display: active === "pests" ? undefined : "none" }}>{pestsTab}</div>
    </div>
  );
}
