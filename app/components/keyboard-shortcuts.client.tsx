"use client";

import React from "react";

const SHORTCUTS = [
  { section: "Global", items: [
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["\u2318", "K"], description: "Open command palette" },
    { keys: ["/"], description: "Focus search in command palette" },
  ]},
  { section: "Navigation", items: [
    { keys: ["G", "H"], description: "Go to Dashboard" },
    { keys: ["G", "Y"], description: "Go to Yard" },
    { keys: ["G", "C"], description: "Go to Calendar" },
    { keys: ["G", "P"], description: "Go to Plants" },
    { keys: ["G", "L"], description: "Go to Log" },
    { keys: ["G", "T"], description: "Go to Tasks" },
  ]},
  { section: "Editing", items: [
    { keys: ["Esc"], description: "Cancel / Close panel" },
    { keys: ["Enter"], description: "Save inline edit" },
  ]},
];

export function KeyboardShortcuts() {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  React.useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (e.key === "/" && !isInput && !open) {
        return;
      }

      if (!isInput && !open) {
        if (e.key === "g" || e.key === "G") {
          if (!gPressed) {
            gPressed = true;
            gTimeout = setTimeout(() => { gPressed = false; }, 1000);
            return;
          }
        }

        if (gPressed) {
          gPressed = false;
          clearTimeout(gTimeout);
          const routes: Record<string, string> = {
            h: "/", y: "/yard", c: "/calendar", p: "/plants", l: "/log", t: "/tasks",
          };
          const route = routes[e.key.toLowerCase()];
          if (route) {
            e.preventDefault();
            window.location.href = route;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [open]);

  const handleAnimationEnd = () => {
    if (!open) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={`absolute inset-0 backdrop-blur-sm ${
        open
          ? "bg-black/40 animate-[fadeIn_0.15s_ease-out_forwards]"
          : "bg-black/40 animate-[fadeOut_0.15s_ease-in_forwards]"
      }`} />
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl border border-earth-200 dark:border-gray-700 shadow-2xl w-full max-w-md overflow-hidden ${
          open
            ? "animate-[scaleIn_0.15s_ease-out]"
            : "animate-[scaleOut_0.15s_ease-in_forwards]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-earth-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-earth-50 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                {section.section}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-[10px] text-gray-400">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-earth-100 dark:border-gray-700 bg-earth-50/50 dark:bg-gray-900/50">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-medium border border-gray-200 dark:border-gray-600">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
