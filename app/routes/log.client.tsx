"use client";

import React from "react";
import { useSearchParams } from "react-router";
import { useToast } from "../components/toast.client";
import { PlantIcon } from "../lib/plant-icons";

// --- Types ---

type LogEntry = {
  id: number;
  date: string;
  type: string;
  content: string | null;
  stage: string | null;
  yieldAmount: number | null;
  yieldUnit: string | null;
  photoPath: string | null;
  plantingId: number | null;
  yardElementId: number | null;
  plantName: string | null;
  plantVariety: string | null;
  bedLabel: string | null;
  bedShapeType: string | null;
};

type PlantingOption = {
  id: number;
  plantName: string;
  plantVariety: string | null;
  yardElementId: number;
  bedLabel: string | null;
};

type FilterState = {
  type: string | null;
  plant: string | null;
  bed: string | null;
};

// --- Constants ---

const LOG_TYPES: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  observation: {
    label: "Observation",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/30",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z",
  },
  watering: {
    label: "Watering",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-900/30 dark:text-cyan-400 dark:ring-cyan-500/30",
    icon: "M12 2L4 14h16L12 2z",
  },
  fertilizing: {
    label: "Fertilizing",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30",
    icon: "M12 3v18m-6-6l6 6 6-6",
  },
  pest: {
    label: "Pest",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30",
    icon: "M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z",
  },
  disease: {
    label: "Disease",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-500/30",
    icon: "M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z",
  },
  harvest: {
    label: "Harvest",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-500/30",
    icon: "M4 7h16M4 12h16M4 17h8",
  },
  pruning: {
    label: "Pruning",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30",
    icon: "M6 3v18M18 3v18M6 12h12",
  },
  stage_change: {
    label: "Stage Change",
    color: "text-garden-600 dark:text-garden-400",
    bgColor: "bg-garden-50 text-garden-700 ring-garden-600/20 dark:bg-garden-900/30 dark:text-garden-400 dark:ring-garden-500/30",
    icon: "M13 7l5 5-5 5M6 7l5 5-5 5",
  },
  weather: {
    label: "Weather",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-500/30",
    icon: "M3 15a4 4 0 004 4h9a5 5 0 10-2-9.8A7 7 0 103 15z",
  },
};

const QUICK_ACTIONS = [
  { type: "observation", label: "Observe", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60" },
  { type: "watering", label: "Water", icon: "M12 2L4 14h16L12 2z", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/40 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/60" },
  { type: "harvest", label: "Harvest", icon: "M4 7h16M4 12h16M4 17h8", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/40 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60" },
  { type: "pest", label: "Pest", icon: "M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z", color: "text-red-600 bg-red-50 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60" },
  { type: "fertilizing", label: "Fertilize", icon: "M12 3v18m-6-6l6 6 6-6", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60" },
  { type: "pruning", label: "Prune", icon: "M6 3v18M18 3v18M6 12h12", color: "text-green-600 bg-green-50 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60" },
];

// --- Export Button ---

export function ExportButton({
  exportAction,
  label,
}: {
  exportAction: () => Promise<{ csv: string; filename: string }>;
  label: string;
}) {
  const [exporting, setExporting] = React.useState(false);
  const { addToast } = useToast();

  async function handleExport() {
    setExporting(true);
    try {
      const { csv, filename } = await exportAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Export downloaded!", "success");
    } catch {
      addToast("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-earth-50 dark:hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {exporting ? "..." : label}
    </button>
  );
}

// --- Main Interactive Log Component ---

export function InteractiveLog({
  entries,
  plantings,
  createAction,
  updateAction,
  deleteAction,
}: {
  entries: LogEntry[];
  plantings: PlantingOption[];
  createAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  updateAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  deleteAction: (formData: FormData) => Promise<{ success: boolean }>;
}) {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters: FilterState = {
    type: searchParams.get("type") || null,
    plant: searchParams.get("plant") || null,
    bed: searchParams.get("bed") || null,
  };
  const setFilters = (updater: (prev: FilterState) => FilterState) => {
    const next = updater(filters);
    const params: Record<string, string> = {};
    if (next.type) params.type = next.type;
    if (next.plant) params.plant = next.plant;
    if (next.bed) params.bed = next.bed;
    setSearchParams(params, { replace: true });
  };
  const [expandedQuickAction, setExpandedQuickAction] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);

  // Derive unique filter values
  const plantNames = React.useMemo(() => {
    const names = new Set<string>();
    entries.forEach((e) => { if (e.plantName) names.add(e.plantName); });
    return Array.from(names).sort();
  }, [entries]);

  const bedLabels = React.useMemo(() => {
    const labels = new Set<string>();
    entries.forEach((e) => { if (e.bedLabel) labels.add(e.bedLabel); });
    return Array.from(labels).sort();
  }, [entries]);

  // Apply filters
  const filteredEntries = React.useMemo(() => {
    return entries.filter((e) => {
      if (filters.type && e.type !== filters.type) return false;
      if (filters.plant && e.plantName !== filters.plant) return false;
      if (filters.bed && e.bedLabel !== filters.bed) return false;
      return true;
    });
  }, [entries, filters]);

  // Group by date
  const grouped = React.useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [filteredEntries]);

  // Harvest totals for current year
  const currentYear = new Date().getFullYear();
  const harvestTotals = React.useMemo(() => {
    const totals: Record<string, { amount: number; unit: string }> = {};
    for (const e of entries) {
      if (e.type === "harvest" && e.yieldAmount != null && e.date.startsWith(String(currentYear))) {
        const key = e.plantName ?? "Unknown";
        const unit = e.yieldUnit ?? "units";
        const tk = `${key}|${unit}`;
        if (!totals[tk]) totals[tk] = { amount: 0, unit };
        totals[tk].amount += e.yieldAmount;
      }
    }
    return totals;
  }, [entries, currentYear]);

  const activeFilters = [filters.type, filters.plant, filters.bed].filter(Boolean).length;

  async function handleDelete(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    const result = await deleteAction(fd);
    if (result.success) {
      addToast("Log entry deleted.", "info");
      if (editingId === id) setEditingId(null);
    }
  }

  async function handleQuickCreate(type: string, content: string, plantingId?: string) {
    const fd = new FormData();
    fd.set("date", new Date().toISOString().split("T")[0]);
    fd.set("type", type);
    if (content) fd.set("content", content);
    if (plantingId) {
      fd.set("plantingId", plantingId);
      const p = plantings.find((p) => String(p.id) === plantingId);
      if (p) fd.set("yardElementId", String(p.yardElementId));
    }
    const result = await createAction(fd);
    if (result.success) {
      addToast(`${LOG_TYPES[type]?.label ?? type} logged!`, "success");
      setExpandedQuickAction(null);
    } else {
      addToast(result.error ?? "Failed to add log entry.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => setExpandedQuickAction(expandedQuickAction === action.type ? null : action.type)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                expandedQuickAction === action.type
                  ? `${action.color} ring-2 ring-current/20`
                  : `${action.color}`
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={action.icon} />
              </svg>
              {action.label}
            </button>
          ))}
        </div>

        {/* Expanded Quick Action Form */}
        {expandedQuickAction && (
          <QuickActionInline
            type={expandedQuickAction}
            plantings={plantings}
            onSubmit={handleQuickCreate}
            onCancel={() => setExpandedQuickAction(null)}
            createAction={createAction}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Filter</span>

        {/* Type filter */}
        <select
          value={filters.type ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value || null }))}
          className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition"
        >
          <option value="">All Types</option>
          {Object.entries(LOG_TYPES).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        {/* Plant filter */}
        {plantNames.length > 0 && (
          <select
            value={filters.plant ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, plant: e.target.value || null }))}
            className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition"
          >
            <option value="">All Plants</option>
            {plantNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        {/* Bed filter */}
        {bedLabels.length > 0 && (
          <select
            value={filters.bed ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, bed: e.target.value || null }))}
            className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition"
          >
            <option value="">All Beds</option>
            {bedLabels.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        )}

        {activeFilters > 0 && (
          <button
            type="button"
            onClick={() => setSearchParams({}, { replace: true })}
            className="text-xs text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 font-medium cursor-pointer"
          >
            Clear ({activeFilters})
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Timeline + Harvest Totals grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-3">
          {filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-earth-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-10 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {activeFilters > 0
                  ? "No entries match your filters."
                  : "No log entries yet. Use the quick actions above to add your first entry."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, dayEntries]) => (
                <div key={date}>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    {formatLogDate(date)}
                  </h3>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <LogEntryCard
                        key={entry.id}
                        entry={entry}
                        isEditing={editingId === entry.id}
                        onStartEdit={() => setEditingId(entry.id)}
                        onStopEdit={() => setEditingId(null)}
                        onDelete={() => handleDelete(entry.id)}
                        updateAction={updateAction}
                        plantings={plantings}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Harvest Totals */}
        {Object.keys(harvestTotals).length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-5 sticky top-24">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {currentYear} Harvest
              </h2>
              <div className="space-y-2">
                {Object.entries(harvestTotals).map(([key, val]) => {
                  const plantName = key.split("|")[0];
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{plantName}</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400 shrink-0 ml-2">
                        {val.amount.toFixed(1)} {val.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Quick Action Inline Form ---

function QuickActionInline({
  type,
  plantings,
  onSubmit,
  onCancel,
  createAction,
}: {
  type: string;
  plantings: PlantingOption[];
  onSubmit: (type: string, content: string, plantingId?: string) => Promise<void>;
  onCancel: () => void;
  createAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}) {
  const [content, setContent] = React.useState("");
  const [plantingId, setPlantingId] = React.useState("");
  const [yieldAmount, setYieldAmount] = React.useState("");
  const [yieldUnit, setYieldUnit] = React.useState("lbs");
  const [submitting, setSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (type === "harvest" && yieldAmount) {
      // Use createAction directly for harvest with yield data
      const fd = new FormData();
      fd.set("date", new Date().toISOString().split("T")[0]);
      fd.set("type", type);
      if (content) fd.set("content", content);
      if (plantingId) {
        fd.set("plantingId", plantingId);
        const p = plantings.find((p) => String(p.id) === plantingId);
        if (p) fd.set("yardElementId", String(p.yardElementId));
      }
      fd.set("yieldAmount", yieldAmount);
      fd.set("yieldUnit", yieldUnit);
      const result = await createAction(fd);
      if (result.success) {
        addToast("Harvest logged!", "success");
        onCancel();
      } else {
        addToast(result.error ?? "Failed to add log entry.", "error");
      }
    } else {
      await onSubmit(type, content, plantingId || undefined);
    }
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  const typeConfig = LOG_TYPES[type];

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-4 animate-[slideUp_0.15s_ease-out]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${typeConfig?.bgColor ?? ""}`}>
          {typeConfig?.label ?? type}
        </span>
        <span className="text-xs text-gray-400">Press Escape to cancel</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          ref={inputRef}
          type="text"
          placeholder={`What happened? (${typeConfig?.label ?? type})`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition dark:text-gray-100"
        />

        {plantings.length > 0 && (
          <select
            value={plantingId}
            onChange={(e) => setPlantingId(e.target.value)}
            className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition dark:text-gray-100"
          >
            <option value="">No plant</option>
            {plantings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plantName}{p.plantVariety ? ` (${p.plantVariety})` : ""}{p.bedLabel ? ` - ${p.bedLabel}` : ""}
              </option>
            ))}
          </select>
        )}

        {type === "harvest" && (
          <>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Amount"
              value={yieldAmount}
              onChange={(e) => setYieldAmount(e.target.value)}
              className="w-20 rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition dark:text-gray-100"
            />
            <select
              value={yieldUnit}
              onChange={(e) => setYieldUnit(e.target.value)}
              className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition dark:text-gray-100"
            >
              <option value="lbs">lbs</option>
              <option value="oz">oz</option>
              <option value="count">count</option>
              <option value="bunches">bunches</option>
              <option value="cups">cups</option>
            </select>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-garden-600 text-white text-sm font-medium hover:bg-garden-700 disabled:opacity-50 transition-colors cursor-pointer press"
        >
          {submitting ? "..." : "Log"}
        </button>
      </div>
    </form>
  );
}

// --- Log Entry Card (with inline editing) ---

function LogEntryCard({
  entry,
  isEditing,
  onStartEdit,
  onStopEdit,
  onDelete,
  updateAction,
  plantings,
}: {
  entry: LogEntry;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  updateAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  plantings: PlantingOption[];
}) {
  const { addToast } = useToast();
  const typeConfig = LOG_TYPES[entry.type] ?? {
    label: entry.type,
    color: "text-gray-600",
    bgColor: "bg-gray-50 text-gray-700 ring-gray-600/20",
    icon: "",
  };

  if (isEditing) {
    return (
      <InlineEditForm
        entry={entry}
        onSave={async (updates) => {
          const fd = new FormData();
          fd.set("id", String(entry.id));
          for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined && val !== null) fd.set(key, String(val));
          }
          const result = await updateAction(fd);
          if (result.success) {
            addToast("Entry updated.", "success");
            onStopEdit();
          } else {
            addToast(result.error ?? "Failed to update.", "error");
          }
        }}
        onCancel={onStopEdit}
        onDelete={onDelete}
        plantings={plantings}
      />
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-earth-200 dark:border-gray-700 shadow-sm p-4 hover:border-garden-300 dark:hover:border-garden-700 card-hover cursor-pointer group"
      onClick={onStartEdit}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap shrink-0 ${typeConfig.bgColor}`}
        >
          {typeConfig.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            {entry.plantName && (
              <span className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                <PlantIcon name={entry.plantName} size={16} className="text-garden-600 dark:text-garden-400 shrink-0" />
                {entry.plantName}
                {entry.plantVariety && (
                  <span className="text-gray-500 dark:text-gray-400 font-normal">({entry.plantVariety})</span>
                )}
              </span>
            )}
            {entry.bedLabel && (
              <span className="text-xs text-gray-400">in {entry.bedLabel}</span>
            )}
          </div>
          {entry.content && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.content}</p>
          )}
          {entry.photoPath && (
            <img
              src={`/api/photos/${entry.photoPath}`}
              alt="Log photo"
              className="mt-2 rounded-lg max-h-48 object-cover border border-earth-200 dark:border-gray-600"
            />
          )}
          {entry.type === "harvest" && entry.yieldAmount != null && (
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">
              Harvested: {entry.yieldAmount} {entry.yieldUnit ?? "units"}
            </p>
          )}
          {entry.type === "stage_change" && entry.stage && (
            <p className="text-sm text-garden-700 dark:text-garden-400 mt-1">Stage: {entry.stage}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            click to edit
          </span>
          <button
            className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete entry"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Inline Edit Form ---

function InlineEditForm({
  entry,
  onSave,
  onCancel,
  onDelete,
  plantings,
}: {
  entry: LogEntry;
  onSave: (updates: Record<string, string | number | null>) => Promise<void>;
  onCancel: () => void;
  onDelete: () => void;
  plantings: PlantingOption[];
}) {
  const [type, setType] = React.useState(entry.type);
  const [content, setContent] = React.useState(entry.content ?? "");
  const [yieldAmount, setYieldAmount] = React.useState(entry.yieldAmount != null ? String(entry.yieldAmount) : "");
  const [yieldUnit, setYieldUnit] = React.useState(entry.yieldUnit ?? "lbs");
  const [plantingId, setPlantingId] = React.useState(entry.plantingId != null ? String(entry.plantingId) : "");
  const [saving, setSaving] = React.useState(false);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    contentRef.current?.focus();
    contentRef.current?.select();
  }, []);

  // Debounced auto-save
  function scheduleAutoSave(updates: Record<string, string | number | null>) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await onSave(updates);
      setSaving(false);
    }, 800);
  }

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      onCancel();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaving(true);
      const selectedPlanting = plantings.find((p) => String(p.id) === plantingId);
      onSave({
        type,
        content: content || null,
        yieldAmount: type === "harvest" && yieldAmount ? Number(yieldAmount) : null,
        yieldUnit: type === "harvest" ? yieldUnit : null,
        plantingId: plantingId ? Number(plantingId) : null,
        yardElementId: selectedPlanting ? selectedPlanting.yardElementId : null,
      }).finally(() => setSaving(false));
    }
  }

  const typeConfig = LOG_TYPES[type] ?? LOG_TYPES.observation;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border-2 border-garden-400 dark:border-garden-600 shadow-md p-4 animate-[slideUp_0.1s_ease-out]"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              scheduleAutoSave({ type: e.target.value });
            }}
            className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs font-medium focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none dark:text-gray-100"
          >
            {Object.entries(LOG_TYPES).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {entry.plantName && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <PlantIcon name={entry.plantName} size={14} className="text-garden-600 dark:text-garden-400" />
              {entry.plantName}
            </span>
          )}

          {saving && (
            <span className="text-xs text-garden-600 dark:text-garden-400 animate-pulse">Saving...</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-2">Enter to save, Esc to cancel</span>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete entry"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            title="Cancel editing"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            scheduleAutoSave({ content: e.target.value || null });
          }}
          placeholder="Notes..."
          rows={2}
          className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition resize-none dark:text-gray-100"
        />

        <div className="flex flex-wrap gap-3">
          {plantings.length > 0 && (
            <select
              value={plantingId}
              onChange={(e) => {
                setPlantingId(e.target.value);
                const p = plantings.find((p) => String(p.id) === e.target.value);
                scheduleAutoSave({
                  plantingId: e.target.value ? Number(e.target.value) : null,
                  yardElementId: p ? p.yardElementId : null,
                });
              }}
              className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none dark:text-gray-100"
            >
              <option value="">No plant</option>
              {plantings.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plantName}{p.plantVariety ? ` (${p.plantVariety})` : ""}{p.bedLabel ? ` - ${p.bedLabel}` : ""}
                </option>
              ))}
            </select>
          )}

          {type === "harvest" && (
            <>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Amount"
                value={yieldAmount}
                onChange={(e) => {
                  setYieldAmount(e.target.value);
                  scheduleAutoSave({ yieldAmount: e.target.value ? Number(e.target.value) : null });
                }}
                className="w-20 rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none dark:text-gray-100"
              />
              <select
                value={yieldUnit}
                onChange={(e) => {
                  setYieldUnit(e.target.value);
                  scheduleAutoSave({ yieldUnit: e.target.value });
                }}
                className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none dark:text-gray-100"
              >
                <option value="lbs">lbs</option>
                <option value="oz">oz</option>
                <option value="count">count</option>
                <option value="bunches">bunches</option>
                <option value="cups">cups</option>
              </select>
            </>
          )}
        </div>

        {entry.photoPath && (
          <img
            src={`/api/photos/${entry.photoPath}`}
            alt="Log photo"
            className="rounded-lg max-h-48 object-cover border border-earth-200 dark:border-gray-600"
          />
        )}
      </div>
    </div>
  );
}

// --- Helpers ---

function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}
