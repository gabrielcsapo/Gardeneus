"use client";

import React from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn>(async () => false);

export function useConfirm() {
  return React.useContext(ConfirmContext);
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = React.useState<
    (ConfirmOptions & { resolve: (value: boolean) => void }) | null
  >(null);
  const [closing, setClosing] = React.useState(false);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setClosing(false);
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setClosing(true);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setClosing(true);
  };

  const handleAnimationEnd = () => {
    if (closing) {
      setDialog(null);
      setClosing(false);
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onAnimationEnd={handleAnimationEnd}
        >
          <div
            className={`absolute inset-0 backdrop-blur-sm ${
              closing
                ? "bg-black/30 animate-[fadeOut_0.15s_ease-in_forwards]"
                : "bg-black/30 animate-[fadeIn_0.15s_ease-out]"
            }`}
            onClick={handleCancel}
          />
          <div
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-earth-200 dark:border-gray-700 w-96 max-w-[90vw] p-6 ${
              closing
                ? "animate-[scaleOut_0.15s_ease-in_forwards]"
                : "animate-[scaleIn_0.15s_ease-out]"
            }`}
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{dialog.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{dialog.message}</p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                className="rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition cursor-pointer press"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition cursor-pointer press ${
                  dialog.destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-garden-600 hover:bg-garden-700"
                }`}
                onClick={handleConfirm}
                autoFocus
              >
                {dialog.confirmLabel ?? (dialog.destructive ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
