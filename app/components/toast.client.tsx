"use client";

import React from "react";

type ToastType = "success" | "error" | "info" | "warning";
type Toast = { id: number; message: string; type: ToastType; removing?: boolean };

const ToastContext = React.createContext<{
  addToast: (message: string, type?: ToastType) => void;
}>({ addToast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

let nextId = 0;

const TYPE_STYLES: Record<ToastType, string> = {
  success: "bg-garden-50 border-garden-300 text-garden-800 dark:bg-garden-900/50 dark:border-garden-700 dark:text-garden-300",
  error: "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300",
  info: "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300",
  warning: "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-300",
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: "M9 12l2 2 4-4",
  error: "M6 18L18 6M6 6l12 12",
  info: "M12 8v4m0 4h.01",
  warning: "M12 9v2m0 4h.01",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Start exit animation after 3s, remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 3000);
  }, []);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.removing
                ? "animate-[slideOut_0.2s_ease-in_forwards]"
                : "animate-[slideIn_0.2s_ease-out]"
            } ${TYPE_STYLES[toast.type]}`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={TYPE_ICONS[toast.type]} />
            </svg>
            <span>{toast.message}</span>
            <button
              className="ml-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => removeToast(toast.id)}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
