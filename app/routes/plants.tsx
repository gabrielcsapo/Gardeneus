import { Link } from "react-flight-router/client";
import { db } from "../db/index.ts";
import { plants, plantings, settings, yardElements, pestDisease } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { PlantSearch, PlantsPageTabs } from "./plants.client.tsx";
import { PestDashboard } from "./pests.client.tsx";
import { createLogEntry } from "./log.actions.ts";

const Component = async () => {
  const [allPlants, userSettings] = await Promise.all([
    db.select().from(plants),
    db.select().from(settings).limit(1).then((r) => r[0]),
  ]);

  const lastFrostDate = userSettings?.lastFrostDate ?? null;

  // Fetch active plantings for "Best for Your Beds" sort
  const activePlantings = await db
    .select({
      plantId: plantings.plantId,
      plantName: plants.name,
      bedLabel: yardElements.label,
      yardElementId: plantings.yardElementId,
    })
    .from(plantings)
    .leftJoin(plants, eq(plantings.plantId, plants.id))
    .leftJoin(yardElements, eq(plantings.yardElementId, yardElements.id));

  // Pests & diseases data
  const allPests = await db
    .select()
    .from(pestDisease)
    .orderBy(sql`${pestDisease.type} ASC, ${pestDisease.name} ASC`);

  const activePlantNames = [...new Set(activePlantings.map((p) => p.plantName).filter(Boolean) as string[])].sort();

  const currentMonth = new Date().getMonth() + 1;
  const seasonalAlertIds = allPests
    .filter((p) => {
      const months = p.activeMonths as number[] | null;
      if (!months || !months.includes(currentMonth)) return false;
      const affected = p.affectedPlants as string[] | null;
      if (!affected) return false;
      return affected.some((ap) => activePlantNames.includes(ap));
    })
    .map((p) => p.id);

  const allSymptoms = new Set<string>();
  for (const p of allPests) {
    if (p.symptoms) {
      p.symptoms.split(/[,;]/).forEach((s) => {
        const trimmed = s.trim().toLowerCase();
        if (trimmed.length > 2) allSymptoms.add(trimmed);
      });
    }
  }
  const symptomList = [...allSymptoms].sort();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Plants</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {allPlants.length} plants with planting schedules for your zone.
        </p>
      </div>

      <PlantsPageTabs
        plantsTab={
          <PlantSearch
            plants={allPlants}
            lastFrostDate={lastFrostDate}
            activePlantings={activePlantings}
          />
        }
        pestsTab={
          <PestDashboard
            pests={allPests}
            plantNames={activePlantNames}
            seasonalAlertIds={seasonalAlertIds}
            symptomList={symptomList}
            currentMonth={currentMonth}
            logAction={createLogEntry}
          />
        }
      />
    </main>
  );
};

export default Component;
