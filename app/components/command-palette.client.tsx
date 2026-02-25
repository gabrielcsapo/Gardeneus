"use client";

import React from "react";
import { useRouter } from "react-flight-router/client";

export type SearchEntry = {
  id: string;
  type: "plant" | "yard" | "bed" | "task";
  label: string;
  sublabel?: string;
  href: string;
};

type CommandPaletteProps = {
  entries: SearchEntry[];
};

const TYPE_ICONS: Record<SearchEntry["type"], React.ReactNode> = {
  plant: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  ),
  yard: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" /><path d="M9 3v18" />
    </svg>
  ),
  bed: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  ),
  task: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
};

const TYPE_COLORS: Record<SearchEntry["type"], string> = {
  plant: "text-garden-600 dark:text-garden-400",
  yard: "text-blue-600 dark:text-blue-400",
  bed: "text-earth-600 dark:text-earth-400",
  task: "text-amber-600 dark:text-amber-400",
};

const QUICK_ACTIONS = [
  { label: "Go to Dashboard", href: "/", shortcut: "D" },
  { label: "Go to Yard Planner", href: "/yard", shortcut: "Y" },
  { label: "Go to Calendar", href: "/calendar", shortcut: "C" },
  { label: "Go to Garden Log", href: "/log", shortcut: "L" },
  { label: "Go to Tasks", href: "/tasks", shortcut: "T" },
  { label: "Go to Settings", href: "/settings", shortcut: "S" },
];

export function CommandPalette({ entries }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const { navigate } = useRouter();

  // Cmd+K / Ctrl+K to open, / to open from anywhere
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // / to open (but not if already in an input)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      if (e.key === "/" && !isInput && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Track visibility for exit animation
  React.useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return entries
      .filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          (e.sublabel && e.sublabel.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [query, entries]);

  const quickActionsFiltered = React.useMemo(() => {
    if (!query.trim()) return QUICK_ACTIONS;
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
  }, [query]);

  const allResults = [...filtered, ...quickActionsFiltered.map((a) => ({
    id: `action-${a.shortcut}`,
    type: "action" as const,
    label: a.label,
    href: a.href,
  }))];

  // Clamp selected index
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const close = () => setOpen(false);

  const go = (href: string) => {
    close();
    navigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      go(allResults[selectedIndex].href);
    } else if (e.key === "Escape") {
      close();
    }
  };

  // Scroll selected item into view
  React.useEffect(() => {
    const item = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleAnimationEnd = () => {
    if (!open) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]"
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={`absolute inset-0 backdrop-blur-sm ${
          open
            ? "bg-black/25 animate-[fadeIn_0.1s_ease-out_forwards]"
            : "bg-black/25 animate-[fadeOut_0.1s_ease-in_forwards]"
        }`}
        onClick={close}
      />
      <div
        className={`relative w-[560px] max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-earth-200 dark:border-gray-700 overflow-hidden ${
          open
            ? "animate-[scaleIn_0.15s_ease-out]"
            : "animate-[scaleOut_0.15s_ease-in_forwards]"
        }`}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-earth-100 dark:border-gray-700">
          <svg
            className="w-5 h-5 text-gray-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search plants, beds, tasks..."
            className="flex-1 py-3.5 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-medium text-gray-400 dark:text-gray-500 border border-earth-200 dark:border-gray-600 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1">
          {allResults.length === 0 && query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Entity results */}
          {filtered.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                selectedIndex === i
                  ? "bg-garden-50 dark:bg-garden-900/20"
                  : "hover:bg-earth-50 dark:hover:bg-gray-700/50"
              }`}
              onClick={() => go(entry.href)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className={TYPE_COLORS[entry.type]}>
                {TYPE_ICONS[entry.type]}
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-gray-900 dark:text-gray-100 font-medium truncate block">
                  {entry.label}
                </span>
                {entry.sublabel && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs truncate block">
                    {entry.sublabel}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 capitalize">
                {entry.type}
              </span>
            </button>
          ))}

          {/* Quick actions */}
          {quickActionsFiltered.length > 0 && (
            <>
              {filtered.length > 0 && (
                <div className="border-t border-earth-100 dark:border-gray-700 my-1" />
              )}
              {quickActionsFiltered.map((action, idx) => {
                const realIndex = filtered.length + idx;
                return (
                  <button
                    key={action.shortcut}
                    type="button"
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      selectedIndex === realIndex
                        ? "bg-garden-50 dark:bg-garden-900/20"
                        : "hover:bg-earth-50 dark:hover:bg-gray-700/50"
                    }`}
                    onClick={() => go(action.href)}
                    onMouseEnter={() => setSelectedIndex(realIndex)}
                  >
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-earth-100 dark:border-gray-700 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="border border-earth-200 dark:border-gray-600 rounded px-1 py-0.5">&uarr;&darr;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-earth-200 dark:border-gray-600 rounded px-1 py-0.5">&crarr;</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-earth-200 dark:border-gray-600 rounded px-1 py-0.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
