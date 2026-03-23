import "./styles.css";
import { Outlet } from "react-flight-router/client";
import { DumpError, GlobalNavigationLoadingBar, ScrollToTop, Sidebar } from "./routes/root.client";
import { ToastProvider } from "./components/toast.client";
import { ConfirmDialogProvider } from "./components/confirm-dialog.client";
import { ThemeProvider } from "./components/theme-provider.client";
import { CommandPalette, type SearchEntry } from "./components/command-palette.client";
import { QuickActionFab } from "./components/quick-action-fab.client";
import { KeyboardShortcuts } from "./components/keyboard-shortcuts.client";
import { db } from "./db/index.ts";
import { plants, yards, yardElements, tasks } from "./db/schema.ts";
import { isNull } from "drizzle-orm";

export default async function Root() {
  // Build lightweight search index for the command palette
  const [allPlants, allYards, allElements, allTasks] = await Promise.all([
    db.select({ id: plants.id, name: plants.name, category: plants.category }).from(plants),
    db.select({ id: yards.id, name: yards.name }).from(yards),
    db.select({ id: yardElements.id, label: yardElements.label, yardId: yardElements.yardId, shapeType: yardElements.shapeType }).from(yardElements),
    db.select({ id: tasks.id, title: tasks.title }).from(tasks).where(isNull(tasks.completedAt)),
  ]);

  const searchEntries: SearchEntry[] = [
    ...allPlants.map((p) => ({
      id: `plant-${p.id}`,
      type: "plant" as const,
      label: p.name,
      sublabel: p.category ?? undefined,
      href: `/plants?selected=${p.id}`,
    })),
    ...allYards.map((y) => ({
      id: `yard-${y.id}`,
      type: "yard" as const,
      label: y.name,
      href: `/yard/${y.id}`,
    })),
    ...allElements
      .filter((e) => e.label)
      .map((e) => ({
        id: `bed-${e.id}`,
        type: "bed" as const,
        label: e.label!,
        sublabel: e.shapeType,
        href: `/yard/${e.yardId}?element=${e.id}`,
      })),
    ...allTasks.map((t) => ({
      id: `task-${t.id}`,
      type: "task" as const,
      label: t.title,
      href: "/tasks",
    })),
  ];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <title>Gardeneus</title>
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <GlobalNavigationLoadingBar />
          <ScrollToTop />
          <Sidebar />
          <KeyboardShortcuts />
          <div className="lg:ml-56" style={{ viewTransitionName: "main-content" }}>
            <ToastProvider>
              <ConfirmDialogProvider>
                <CommandPalette entries={searchEntries} />
                <QuickActionFab />
                <Outlet />
              </ConfirmDialogProvider>
            </ToastProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return <DumpError error={error} />;
}
