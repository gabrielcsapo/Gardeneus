"use client";

import React from "react";
import { useRouter, useLocation } from "react-flight-router/client";

const ACTIONS = [
  {
    label: "Quick Log",
    href: "/log",
    color: "bg-blue-500",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: "Add Task",
    href: "/tasks",
    color: "bg-amber-500",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "View Yard",
    href: "/yard",
    color: "bg-garden-500",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" /><path d="M9 3v18" />
      </svg>
    ),
  },
];

export function QuickActionFab() {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const { navigate } = useRouter();
  const location = useLocation();
  const fabRef = React.useRef<HTMLDivElement>(null);

  // Hide on yard editor (it has its own toolbar)
  const hidden = /^\/yard\/\d+/.test(location.pathname);

  React.useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on navigation
  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleAnimationEnd = () => {
    if (!open) setVisible(false);
  };

  if (hidden) return null;

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50 lg:hidden flex flex-col-reverse items-end gap-2">
      {/* Main FAB button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full bg-garden-600 text-white shadow-lg hover:bg-garden-700 transition-all duration-200 cursor-pointer press flex items-center justify-center ${
          open ? "rotate-45" : ""
        }`}
      >
        <svg
          className="w-6 h-6 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Action buttons */}
      {visible &&
        ACTIONS.map((action, i) => (
          <button
            key={action.label}
            type="button"
            className={`flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full ${action.color} text-white shadow-lg text-sm font-medium cursor-pointer press`}
            style={{
              animation: open
                ? `slideUp 0.15s ease-out ${i * 0.04}s both`
                : `slideDown 0.12s ease-in ${(ACTIONS.length - 1 - i) * 0.03}s both`,
            }}
            onAnimationEnd={i === (open ? ACTIONS.length - 1 : 0) ? handleAnimationEnd : undefined}
            onClick={() => {
              setOpen(false);
              navigate(action.href);
            }}
          >
            <span>{action.label}</span>
            {action.icon}
          </button>
        ))}
    </div>
  );
}
