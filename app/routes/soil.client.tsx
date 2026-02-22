"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "../components/toast.client";

type SoilProfile = {
  id: number;
  yardElementId: number | null;
  bedLabel: string | null;
  testDate: string | null;
  ph: number | null;
  nitrogenLevel: string | null;
  phosphorusLevel: string | null;
  potassiumLevel: string | null;
  organicMatterPct: number | null;
  soilType: string | null;
  notes: string | null;
};

type Bed = { id: number; label: string | null };

function phColor(ph: number | null): string {
  if (ph == null) return "text-gray-400";
  if (ph < 5.5) return "text-red-600 dark:text-red-400";
  if (ph < 6.0) return "text-amber-600 dark:text-amber-400";
  if (ph <= 7.0) return "text-green-600 dark:text-green-400";
  if (ph <= 7.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function levelBadge(level: string | null): string {
  if (!level) return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  if (level === "low") return "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400";
  if (level === "medium") return "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
  if (level === "high") return "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400";
  return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
}

export function SoilProfileList({
  profiles,
  beds,
  addAction,
  deleteAction,
}: {
  profiles: SoilProfile[];
  beds: Bed[];
  addAction: (formData: FormData) => Promise<{ success: boolean }>;
  deleteAction: (formData: FormData) => Promise<{ success: boolean }>;
}) {
  const [showAdd, setShowAdd] = React.useState(false);
  const { addToast } = useToast();

  // Group profiles by bed for sparklines
  const bedTrends = React.useMemo(() => {
    const byBed: Record<string, { label: string; phValues: number[]; dates: string[] }> = {};
    for (const p of profiles) {
      const key = p.bedLabel ?? `Bed #${p.yardElementId}`;
      if (!byBed[key]) byBed[key] = { label: key, phValues: [], dates: [] };
      if (p.ph != null && p.testDate) {
        byBed[key].phValues.unshift(p.ph); // oldest first
        byBed[key].dates.unshift(p.testDate);
      }
    }
    return Object.values(byBed).filter((b) => b.phValues.length >= 2);
  }, [profiles]);

  return (
    <div className="space-y-4">
      {/* pH Trend Sparklines */}
      {bedTrends.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bedTrends.map((bed) => (
            <div key={bed.label} className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{bed.label}</span>
                <span className={`text-xs font-bold ${phColor(bed.phValues[bed.phValues.length - 1])}`}>
                  pH {bed.phValues[bed.phValues.length - 1].toFixed(1)}
                </span>
              </div>
              <PhSparkline values={bed.phValues} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-gray-400">{bed.dates[0]}</span>
                <span className="text-[9px] text-gray-400">{bed.dates[bed.dates.length - 1]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{profiles.length} test{profiles.length !== 1 ? "s" : ""} recorded</p>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-garden-600 text-white hover:bg-garden-700 transition cursor-pointer press"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Test
        </button>
      </div>

      {showAdd && (
        <form
          className="bg-earth-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3"
          action={async (formData) => {
            const result = await addAction(formData);
            if (result.success) {
              setShowAdd(false);
              addToast("Soil test added!", "success");
            }
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <select
              name="yardElementId"
              className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
            >
              <option value="">Select bed</option>
              {beds.map((b) => (
                <option key={b.id} value={b.id}>{b.label ?? `Bed #${b.id}`}</option>
              ))}
            </select>
            <input name="testDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">pH</label>
              <input name="ph" type="number" step="0.1" min="0" max="14" placeholder="6.5" className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">N</label>
              <select name="nitrogenLevel" className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition">
                <option value="">-</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">P</label>
              <select name="phosphorusLevel" className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition">
                <option value="">-</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">K</label>
              <select name="potassiumLevel" className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition">
                <option value="">-</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Organic Matter %</label>
              <input name="organicMatterPct" type="number" step="0.1" min="0" max="100" placeholder="3.5" className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Soil Type</label>
              <select name="soilType" className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition">
                <option value="">Unknown</option>
                <option value="sandy">Sandy</option>
                <option value="loam">Loam</option>
                <option value="clay">Clay</option>
                <option value="silt">Silt</option>
                <option value="peat">Peat</option>
                <option value="chalky">Chalky</option>
              </select>
            </div>
          </div>
          <textarea name="notes" placeholder="Notes..." rows={2} className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400 resize-none" />
          <div className="flex gap-2">
            <SubmitBtn />
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.bedLabel ?? `Bed #${p.yardElementId}`}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {p.testDate ? new Date(p.testDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}
                  {p.soilType && ` \u00b7 ${p.soilType}`}
                </p>
              </div>
              <form action={async (formData) => {
                await deleteAction(formData);
                addToast("Test deleted", "success");
              }}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition" title="Delete">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">pH</p>
                <p className={`text-lg font-bold ${phColor(p.ph)}`}>{p.ph?.toFixed(1) ?? "-"}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">N</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelBadge(p.nitrogenLevel)}`}>{p.nitrogenLevel ?? "-"}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">P</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelBadge(p.phosphorusLevel)}`}>{p.phosphorusLevel ?? "-"}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">K</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelBadge(p.potassiumLevel)}`}>{p.potassiumLevel ?? "-"}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">OM%</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{p.organicMatterPct?.toFixed(1) ?? "-"}</p>
              </div>
            </div>
            {p.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{p.notes}</p>}
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-earth-300 dark:text-gray-600 mb-4" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="36" width="48" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M8 42h48" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <path d="M8 48h48" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="20" cy="30" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <circle cx="32" cy="26" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <circle cx="44" cy="30" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <path d="M32 22v-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 16l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No soil tests yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Add your first soil test to track pH and nutrient levels over time.</p>
        </div>
      )}
    </div>
  );
}

function SubmitBtn() {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-garden-700 disabled:opacity-50 transition-colors cursor-pointer press">
      {status.pending ? "Adding..." : "Add Test"}
    </button>
  );
}

function PhSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const w = 120;
  const h = 32;
  const pad = 2;
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  // Ideal pH band (6.0 - 7.0)
  const idealTop = pad + ((max - 7.0) / range) * (h - pad * 2);
  const idealBottom = pad + ((max - 6.0) / range) * (h - pad * 2);
  const clampedTop = Math.max(pad, Math.min(h - pad, idealTop));
  const clampedBottom = Math.max(pad, Math.min(h - pad, idealBottom));

  return (
    <svg width={w} height={h} className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* Ideal pH band */}
      <rect
        x={0} y={clampedTop}
        width={w} height={Math.max(0, clampedBottom - clampedTop)}
        fill="currentColor" className="text-green-100 dark:text-green-900/30"
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-garden-500"
      />
      {/* Dots */}
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = pad + ((max - v) / range) * (h - pad * 2);
        return (
          <circle
            key={i}
            cx={x} cy={y} r="2.5"
            fill="currentColor"
            className={v >= 6.0 && v <= 7.0 ? "text-green-500" : v >= 5.5 && v <= 7.5 ? "text-amber-500" : "text-red-500"}
          />
        );
      })}
    </svg>
  );
}
