"use client";

import React from "react";

type SlideOverPanelProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
};

export function SlideOverPanel({
  open,
  onClose,
  title,
  children,
  width = "w-[420px]",
}: SlideOverPanelProps) {
  const [visible, setVisible] = React.useState(false);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Track visibility for exit animation
  React.useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  // Prevent body scroll when visible
  React.useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const handleAnimationEnd = () => {
    if (!open) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onAnimationEnd={handleAnimationEnd}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-sm ${
          open
            ? "bg-black/20 animate-[fadeIn_0.15s_ease-out_forwards]"
            : "bg-black/20 animate-[fadeOut_0.15s_ease-in_forwards]"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative ${width} max-w-[90vw] h-full bg-white dark:bg-gray-900 border-l border-earth-200 dark:border-gray-700 shadow-2xl flex flex-col ${
          open
            ? "animate-[slideInRight_0.2s_ease-out]"
            : "animate-[slideOutRight_0.2s_ease-in_forwards]"
        }`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 h-14 border-b border-earth-100 dark:border-gray-800 shrink-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-earth-50 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
