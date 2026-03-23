"use client";

import React from "react";
import { Link, useLocation, useNavigation } from "react-flight-router/client";
import { useTheme } from "../components/theme-provider.client";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Yard",
    to: "/yard",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 3v18" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    to: "/calendar",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Plants",
    to: "/plants",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 20h10" />
        <path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
        <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
      </svg>
    ),
  },
  {
    label: "Log",
    to: "/log",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    to: "/tasks",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Pests",
    to: "/pests",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    label: "Seeds",
    to: "/seeds",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Soil",
    to: "/soil",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 22h20" />
        <path d="M7 10c0-3 2-5 5-5s5 2 5 5" />
        <path d="M4 22V10" />
        <path d="M20 22V10" />
        <path d="M12 5V2" />
        <path d="M8 22v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4" />
      </svg>
    ),
  },
];


const PRIMARY_NAV = NAV_ITEMS.slice(0, 3); // Dashboard, Yard, Calendar
const SECONDARY_NAV = NAV_ITEMS.slice(3);  // Plants, Log, Tasks, Pests, Seeds, Soil

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: { label: string; to: string; icon: React.ReactNode };
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 no-underline ${
        isActive
          ? "bg-garden-50 text-garden-700 border-l-2 border-garden-500 dark:bg-garden-900/30 dark:text-garden-400 dark:border-garden-400"
          : "border-l-2 border-transparent text-gray-500 hover:text-gray-900 hover:bg-earth-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
      } ${collapsed ? "justify-center" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { isDark, toggleDark } = useTheme();

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  // Close mobile menu on navigation
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-earth-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
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
          {mobileOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-white dark:bg-gray-900 border-r border-earth-200 dark:border-gray-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-56 lg:w-56`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-earth-100 dark:border-gray-800 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-garden-700 dark:text-garden-400 font-semibold text-base no-underline"
          >
            <svg
              className="w-6 h-6 shrink-0"
              viewBox="0 0 1024 1024"
              role="img"
              aria-label="Gardeneus"
            >
              <circle cx="512" cy="512" r="480" fill="currentColor" />
              <g fill="white">
                <rect x="480" y="560" width="64" height="240" rx="32" />
                <path d="M512 560c-150 0-230-80-230-230 0-16 13-29 29-29 150 0 230 80 230 230 0 16-13 29-29 29zm-164-201c12 88 65 134 137 143-9-72-55-125-137-143z" />
                <path d="M512 560c-16 0-29-13-29-29 0-150 80-230 230-230 16 0 29 13 29 29 0 150-80 230-230 230zm29-58c72-9 125-55 143-137-88 12-134 65-143 137z" />
              </g>
            </svg>
            <span>Gardeneus</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col px-3 py-3 overflow-y-auto">
          <div className="flex flex-col gap-0.5">
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.to} item={item} isActive={isActive(item.to)} collapsed={false} />
            ))}
          </div>
          <div className="my-2 mx-3 border-t border-earth-100 dark:border-gray-800" />
          <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Manage</p>
          <div className="flex flex-col gap-0.5">
            {SECONDARY_NAV.map((item) => (
              <NavLink key={item.to} item={item} isActive={isActive(item.to)} collapsed={false} />
            ))}
          </div>
        </nav>

        {/* API Docs link */}
        <div className="px-3 pb-1">
          <Link
            to="/docs"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors no-underline ${
              isActive("/docs")
                ? "bg-garden-50 text-garden-700 dark:bg-garden-900/30 dark:text-garden-400"
                : "text-gray-400 hover:text-gray-600 hover:bg-earth-50 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            API Docs
          </Link>
        </div>

        {/* Dark mode toggle + Settings at bottom */}
        <div className="border-t border-earth-100 dark:border-gray-800 px-3 py-3 flex items-center gap-1">
          <button
            type="button"
            className="flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-150 text-gray-500 hover:text-gray-900 hover:bg-earth-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 cursor-pointer press"
            onClick={toggleDark}
            title={isDark ? "Light Mode" : "Dark Mode"}
          >
            {isDark ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Link
            to="/settings"
            className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-150 press ${
              isActive("/settings")
                ? "text-garden-700 bg-garden-50 dark:text-garden-400 dark:bg-garden-900/30"
                : "text-gray-500 hover:text-gray-900 hover:bg-earth-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Settings"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </aside>
    </>
  );
}

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
    <div className={`h-0.5 w-full bg-garden-100 dark:bg-garden-900 overflow-hidden fixed top-0 left-0 z-50 ${
      completing ? "animate-[fadeOut_0.3s_ease-in_forwards]" : ""
    }`}>
      <div className={`w-full h-full bg-garden-500 ${
        completing ? "!w-full transition-none" : "animate-progress origin-[0%_50%]"
      }`} />
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
            <pre className="text-xs text-gray-500 dark:text-gray-400 overflow-auto whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">An unknown error occurred.</p>
      )}
    </main>
  );
}
