"use client";

import React from "react";
import { Link } from "react-flight-router/client";

const SECTIONS = ["design", "calendar", "log"] as const;
type Section = (typeof SECTIONS)[number];

function getHashSection(): Section {
  if (typeof window === "undefined") return "design";
  const hash = window.location.hash.slice(1);
  return (SECTIONS as readonly string[]).includes(hash) ? (hash as Section) : "design";
}

const SECTION_META: Record<Section, { label: string; icon: string }> = {
  design: {
    label: "Design",
    icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  },
  calendar: {
    label: "Calendar",
    icon: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
  },
  log: {
    label: "Log",
    icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  },
};

export function GardenHub({
  yardId,
  yardName,
  yards,
  designSection,
  calendarSection,
  logSection,
}: {
  yardId: number;
  yardName: string;
  yards: { id: number; name: string }[];
  designSection: React.ReactNode;
  calendarSection: React.ReactNode;
  logSection: React.ReactNode;
}) {
  const [active, setActive] = React.useState<Section>(getHashSection);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);
  const switcherRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    let dark: boolean;
    if (stored === "dark") dark = true;
    else if (stored === "light") dark = false;
    else dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  React.useEffect(() => {
    const handler = () => setActive(getHashSection());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  // Close switcher on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSectionClick(section: Section) {
    window.location.hash = section;
    setActive(section);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="flex items-center gap-2 px-4 h-12 border-b border-earth-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">

        {/* Garden switcher */}
        <div ref={switcherRef} className="relative">
          <button
            type="button"
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-earth-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0 text-garden-600 dark:text-garden-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 3v18" />
            </svg>
            <span>{yardName}</span>
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${switcherOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {switcherOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-44 bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-lg overflow-hidden">
              {yards.map((y) => (
                <Link
                  key={y.id}
                  to={`/yard/${y.id}`}
                  onClick={() => { setSwitcherOpen(false); window.location.hash = ""; setActive("design"); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm no-underline transition-colors ${
                    y.id === yardId
                      ? "bg-garden-50 text-garden-700 dark:bg-garden-900/30 dark:text-garden-400 font-medium"
                      : "text-gray-700 dark:text-gray-200 hover:bg-earth-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {y.id === yardId && (
                    <svg className="w-3.5 h-3.5 text-garden-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {y.id !== yardId && <span className="w-3.5 shrink-0" />}
                  {y.name}
                </Link>
              ))}
              <div className="border-t border-earth-100 dark:border-gray-700">
                <Link
                  to="/yard"
                  onClick={() => setSwitcherOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-earth-50 dark:hover:bg-gray-700 no-underline transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New garden
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-earth-200 dark:bg-gray-700 shrink-0" />

        {/* Section tabs */}
        <div className="flex items-center gap-0.5">
          {SECTIONS.map((section) => {
            const meta = SECTION_META[section];
            return (
              <button
                key={section}
                type="button"
                onClick={() => handleSectionClick(section)}
                title={meta.label}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  active === section
                    ? "bg-garden-50 text-garden-700 dark:bg-garden-900/30 dark:text-garden-400"
                    : "text-gray-400 hover:text-gray-700 hover:bg-earth-50 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={meta.icon} />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-earth-200 dark:bg-gray-700 shrink-0" />

        {/* Sub-route links */}
        <div className="flex items-center gap-0.5">
          {[
            { path: "plants", label: "Plants", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
            { path: "tasks", label: "Tasks", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
            { path: "seeds", label: "Seeds", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" },
            { path: "soil", label: "Soil", icon: "M2 22h20M6.36 17.4L4 17l2-4.5 1 1 3-2 2 3 3.5-5L18 12l2-3v8" },
            { path: "pests", label: "Pests", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
          ].map((item) => (
            <Link
              key={item.path}
              to={`/yard/${yardId}/${item.path}`}
              title={item.label}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-earth-50 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors no-underline"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Dark mode + Settings */}
        <button
          type="button"
          onClick={toggleDark}
          title={isDark ? "Light mode" : "Dark mode"}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-earth-50 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {isDark ? (
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <Link
          to={`/yard/${yardId}/settings`}
          title="Settings"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-earth-50 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors no-underline"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      {/* Section content */}
      <div className="flex-1 min-h-0">
        {/* Design stays mounted to preserve SVG editor state */}
        <div style={{ display: active === "design" ? undefined : "none", height: "100%" }}>
          {designSection}
        </div>
        {active === "calendar" && <div>{calendarSection}</div>}
        {active === "log" && <div>{logSection}</div>}
      </div>
    </div>
  );
}
