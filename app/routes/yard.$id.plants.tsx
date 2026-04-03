import { db } from "../db/index.ts";
import { plants, plantings, settings, yardElements, pestDisease } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { PlantSearch, PlantsPageTabs } from "./plants.client.tsx";
import { PestDashboard } from "./pests.client.tsx";
import { createLogEntry } from "./log.actions.ts";
import { RouteSlideOver } from "../components/route-slide-over.client.tsx";

const Component = async () => {
  const [allPlants, userSettings] = await Promise.all([
    db.select().from(plants),
    db.select().from(settings).limit(1).then((r) => r[0]),
  ]);

  const lastFrostDate = userSettings?.lastFrostDate ?? null;

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
    <RouteSlideOver title="Plants" width="w-[720px]">
      <div className="p-5">
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
      </div>
    </RouteSlideOver>
  );
};

export default Component;
