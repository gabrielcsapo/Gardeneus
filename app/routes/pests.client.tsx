"use client";

import React from "react";
import { useSearchParams } from "react-flight-router/client";

type Pest = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  symptoms: string | null;
  organicTreatments: unknown;
  preventionTips: unknown;
  affectedPlants: unknown;
  beneficialPredators: unknown;
  activeMonths: unknown;
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PestDashboard({
  pests,
  plantNames,
  seasonalAlertIds,
  symptomList,
  currentMonth,
  logAction,
}: {
  pests: Pest[];
  plantNames: string[];
  seasonalAlertIds: number[];
  symptomList: string[];
  currentMonth: number;
  logAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const setSearch = (q: string) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (typeFilter !== "all") params.type = typeFilter;
    if (selectedPlant) params.plant = selectedPlant;
    setSearchParams(params, { replace: true });
  };
  const typeFilter = (searchParams.get("type") as "all" | "pest" | "disease") || "all";
  const setTypeFilter = (t: "all" | "pest" | "disease") => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (t !== "all") params.type = t;
    if (selectedPlant) params.plant = selectedPlant;
    setSearchParams(params, { replace: true });
  };
  const selectedPlant = searchParams.get("plant") || "";
  const setSelectedPlant = (p: string) => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (typeFilter !== "all") params.type = typeFilter;
    if (p) params.plant = p;
    setSearchParams(params, { replace: true });
  };
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = React.useState<string[]>([]);
  const [showSymptomChecker, setShowSymptomChecker] = React.useState(false);
  const [loggedPestId, setLoggedPestId] = React.useState<number | null>(null);
  const [showAlerts, setShowAlerts] = React.useState(true);

  const seasonalAlerts = pests.filter((p) => seasonalAlertIds.includes(p.id));

  // Build a map of symptom -> pest IDs for the checker
  const symptomToPests = React.useMemo(() => {
    const map = new Map<string, number[]>();
    for (const p of pests) {
      if (p.symptoms) {
        p.symptoms.split(/[,;]/).forEach((s) => {
          const trimmed = s.trim().toLowerCase();
          if (trimmed.length > 2) {
            const ids = map.get(trimmed) || [];
            ids.push(p.id);
            map.set(trimmed, ids);
          }
        });
      }
    }
    return map;
  }, [pests]);

  // Get pests matching selected symptoms
  const symptomMatchIds = React.useMemo(() => {
    if (selectedSymptoms.length === 0) return new Set<number>();
    const counts = new Map<number, number>();
    for (const sym of selectedSymptoms) {
      const ids = symptomToPests.get(sym) || [];
      for (const id of ids) {
        counts.set(id, (counts.get(id) || 0) + 1);
      }
    }
    // Return all that match at least one symptom, sorted by match count
    return new Set(
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
    );
  }, [selectedSymptoms, symptomToPests]);

  const filtered = pests.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedPlant) {
      const affected = p.affectedPlants as string[] | null;
      if (!affected || !affected.includes(selectedPlant)) return false;
    }
    if (selectedSymptoms.length > 0 && !symptomMatchIds.has(p.id)) return false;
    return true;
  });

  const handleLogPest = async (pest: Pest) => {
    const formData = new FormData();
    formData.set("type", "pest");
    formData.set("content", `Observed: ${pest.name}`);
    formData.set("date", new Date().toISOString().split("T")[0]);
    formData.set("pestDiseaseId", String(pest.id));
    const result = await logAction(formData);
    if (result.success) {
      setLoggedPestId(pest.id);
      setTimeout(() => setLoggedPestId(null), 2000);
    }
  };

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  return (
    <div className="space-y-6">
      {/* Seasonal Alerts — expanded to full cards */}
      {seasonalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 transition"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-200">
                Watch List — Active in {MONTH_NAMES[currentMonth - 1]} ({seasonalAlerts.length})
              </h2>
            </div>
            <svg className={`w-4 h-4 text-red-400 transition-transform ${showAlerts ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showAlerts && (
            <div className="px-4 pb-4 space-y-2">
              {seasonalAlerts.map((pest) => {
                const affected = pest.affectedPlants as string[] | null;
                const treatments = pest.organicTreatments as string[] | null;
                return (
                  <div key={pest.id} className="bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${pest.type === "pest" ? "bg-red-500" : "bg-amber-500"}`} />
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{pest.name}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            pest.type === "pest"
                              ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {pest.type}
                          </span>
                        </div>
                        {pest.symptoms && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pest.symptoms}</p>
                        )}
                        {affected && affected.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {affected.filter((a) => plantNames.includes(a)).map((a) => (
                              <span key={a} className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                        {treatments && treatments.length > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">
                            Treatment: {treatments[0]}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLogPest(pest)}
                        className={`shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          loggedPestId === pest.id
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                        }`}
                      >
                        {loggedPestId === pest.id ? "Logged!" : "Log this"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Symptom Checker */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSymptomChecker(!showSymptomChecker)}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-earth-50 dark:hover:bg-gray-700/50 transition"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Symptom Checker
            </h2>
            {selectedSymptoms.length > 0 && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                {selectedSymptoms.length} selected — {symptomMatchIds.size} match{symptomMatchIds.size !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showSymptomChecker ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showSymptomChecker && (
          <div className="px-4 pb-4 border-t border-earth-100 dark:border-gray-700 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Select symptoms you're observing to narrow down potential pests or diseases.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {symptomList.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                    selectedSymptoms.includes(sym)
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700"
                      : "bg-earth-50 text-earth-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-earth-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            {selectedSymptoms.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSymptoms([])}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer"
              >
                Clear symptoms
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search pests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400"
        />
        <div className="flex items-center gap-1">
          {(["all", "pest", "disease"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                typeFilter === t
                  ? t === "pest"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : t === "disease"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-garden-50 text-garden-700 dark:bg-garden-900/30 dark:text-garden-400"
                  : "text-gray-500 hover:bg-earth-50 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}{t === "all" ? "" : "s"}
            </button>
          ))}
        </div>
        {plantNames.length > 0 && (
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
          >
            <option value="">All plants</option>
            {plantNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>

      {/* Pest cards */}
      <div className="space-y-3">
        {filtered.map((pest) => (
          <PestCard
            key={pest.id}
            pest={pest}
            isExpanded={expandedId === pest.id}
            onToggle={() => setExpandedId(expandedId === pest.id ? null : pest.id)}
            isSymptomMatch={symptomMatchIds.has(pest.id)}
            selectedSymptoms={selectedSymptoms}
            onLog={() => handleLogPest(pest)}
            isLogged={loggedPestId === pest.id}
            currentMonth={currentMonth}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-garden-300 dark:text-gray-600 mb-4" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" />
            <path d="M32 24v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="40" r="1.5" fill="currentColor" />
            <path d="M18 18l4 4M46 18l-4 4M18 46l4-4M46 46l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No matches found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}

function PestCard({
  pest,
  isExpanded,
  onToggle,
  isSymptomMatch,
  selectedSymptoms,
  onLog,
  isLogged,
  currentMonth,
}: {
  pest: Pest;
  isExpanded: boolean;
  onToggle: () => void;
  isSymptomMatch: boolean;
  selectedSymptoms: string[];
  onLog: () => void;
  isLogged: boolean;
  currentMonth: number;
}) {
  const treatments = pest.organicTreatments as string[] | null;
  const prevention = pest.preventionTips as string[] | null;
  const affected = pest.affectedPlants as string[] | null;
  const predators = pest.beneficialPredators as string[] | null;
  const months = pest.activeMonths as number[] | null;
  const isActive = months?.includes(currentMonth);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden card-hover ${
        isSymptomMatch && selectedSymptoms.length > 0
          ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800"
          : "border-earth-200 dark:border-gray-700"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer hover:bg-earth-50 dark:hover:bg-gray-700/50 transition"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          pest.type === "pest"
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {pest.type === "pest" ? (
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            ) : (
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            )}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{pest.name}</p>
            {isActive && (
              <span className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                Active now
              </span>
            )}
            {isSymptomMatch && selectedSymptoms.length > 0 && (
              <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                Symptom match
              </span>
            )}
          </div>
          {pest.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{pest.description}</p>
          )}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          pest.type === "pest"
            ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>
          {pest.type}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-earth-100 dark:border-gray-700 pt-3">
          {pest.symptoms && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Symptoms</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{pest.symptoms}</p>
            </div>
          )}

          {treatments && treatments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Organic Treatments</h4>
              <ul className="space-y-1">
                {treatments.map((t, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <span className="text-green-500 mt-1 shrink-0">&#8226;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prevention && prevention.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Prevention</h4>
              <ul className="space-y-1">
                {prevention.map((t, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-1 shrink-0">&#8226;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {predators && predators.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Beneficial Predators</h4>
              <div className="flex flex-wrap gap-1.5">
                {predators.map((p, i) => (
                  <span key={i} className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {affected && affected.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Affected Plants</h4>
              <div className="flex flex-wrap gap-1.5">
                {affected.map((a, i) => (
                  <span key={i} className="text-xs bg-earth-100 dark:bg-gray-700 text-earth-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {months && months.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Active Months</h4>
              <div className="flex gap-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <span
                    key={m}
                    className={`text-[10px] w-7 text-center py-0.5 rounded ${
                      months.includes(m)
                        ? m === currentMonth
                          ? "bg-red-200 text-red-800 dark:bg-red-800/60 dark:text-red-200 font-bold ring-1 ring-red-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium"
                        : "bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    }`}
                  >
                    {MONTH_NAMES[m - 1]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Log this pest action */}
          <div className="pt-2 border-t border-earth-100 dark:border-gray-700">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onLog(); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                isLogged
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              }`}
            >
              {isLogged ? "Logged to garden journal!" : "Log this pest sighting"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
