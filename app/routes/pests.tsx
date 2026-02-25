import { Link } from "react-flight-router/client";
import { db } from "../db/index.ts";
import { pestDisease, plantings, plants } from "../db/schema.ts";
import { sql, eq } from "drizzle-orm";
import { createLogEntry } from "./log.actions.ts";
import { PestDashboard } from "./pests.client.tsx";

const Component = async () => {
  const allPests = await db
    .select()
    .from(pestDisease)
    .orderBy(sql`${pestDisease.type} ASC, ${pestDisease.name} ASC`);

  // Get active plant names for filtering
  const activePlantNames = await db
    .select({ name: plants.name })
    .from(plantings)
    .innerJoin(plants, eq(plantings.plantId, plants.id))
    .where(sql`${plantings.status} != 'done'`);
  const uniquePlantNames = [...new Set(activePlantNames.map((p) => p.name))].sort();

  // Seasonal alerts: pests active this month that affect plants we're growing
  const currentMonth = new Date().getMonth() + 1;
  const seasonalAlertIds = allPests
    .filter((p) => {
      const months = p.activeMonths as number[] | null;
      if (!months || !months.includes(currentMonth)) return false;
      const affected = p.affectedPlants as string[] | null;
      if (!affected) return false;
      return affected.some((ap) => uniquePlantNames.includes(ap));
    })
    .map((p) => p.id);

  // Collect all unique symptoms for symptom checker
  const allSymptoms = new Set<string>();
  for (const p of allPests) {
    if (p.symptoms) {
      // Split on commas or semicolons to get individual symptoms
      p.symptoms.split(/[,;]/).forEach((s) => {
        const trimmed = s.trim().toLowerCase();
        if (trimmed.length > 2) allSymptoms.add(trimmed);
      });
    }
  }
  const symptomList = [...allSymptoms].sort();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Pests & Diseases</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Pests & Diseases</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Reference guide with organic treatments and prevention tips.
        </p>
      </div>

      <PestDashboard
        pests={allPests}
        plantNames={uniquePlantNames}
        seasonalAlertIds={seasonalAlertIds}
        symptomList={symptomList}
        currentMonth={currentMonth}
        logAction={createLogEntry}
      />
    </main>
  );
};

export default Component;
