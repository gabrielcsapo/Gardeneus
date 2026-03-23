"use client";

import React from "react";
import { useLocation, useNavigation } from "react-flight-router/client";

export function ScrollToTop() {
  const location = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  return null;
}

export function GlobalNavigationLoadingBar() {
  const navigation = useNavigation();
  const [show, setShow] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);

  React.useEffect(() => {
    if (navigation.state !== "idle") {
      setShow(true);
      setCompleting(false);
    } else if (show) {
      setCompleting(true);
      const t = setTimeout(() => {
        setShow(false);
        setCompleting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [navigation.state]);

  if (!show) return null;

  return (
    <div className={`h-0.5 w-full bg-garden-100 dark:bg-garden-900 overflow-hidden fixed top-0 left-0 z-50 ${completing ? "animate-[fadeOut_0.3s_ease-in_forwards]" : ""}`}>
      <div className={`w-full h-full bg-garden-500 ${completing ? "!w-full transition-none" : "animate-progress origin-[0%_50%]"}`} />
    </div>
  );
}

export function DumpError({ error }: { error: Error }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Something went wrong</h1>
      {error instanceof Error ? (
        <div className="text-left bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error.message}</p>
          {error.stack && (
            <pre className="text-xs text-gray-500 dark:text-gray-400 overflow-auto whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">An unknown error occurred.</p>
      )}
    </main>
  );
}
