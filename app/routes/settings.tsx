import { Link } from "react-flight-router/client";
import { db } from "../db/index.ts";
import { settings } from "../db/schema.ts";
import { USDA_ZONES } from "../lib/zones.ts";
import { SettingsForm } from "./settings.client.tsx";
import zipZoneData from "../db/zip-zones.json";

const Component = async () => {
  const current = await db.select().from(settings).limit(1);
  const currentSettings = current[0] ?? null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Settings</span>
      </nav>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-5 border-b border-earth-100 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Garden Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your growing zone and frost dates to get personalized planting
            recommendations.
          </p>
        </div>

        <SettingsForm
          currentSettings={currentSettings}
          zipZoneData={
            zipZoneData as Record<string, { zone: string; lastFrost: string; firstFrost: string }>
          }
          zones={USDA_ZONES}
        />
      </div>
    </main>
  );
};

export default Component;
