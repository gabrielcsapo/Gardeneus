import { db } from "../db/index.ts";
import { pestDisease, plantings, plants } from "../db/schema.ts";
import { sql, eq } from "drizzle-orm";
import { createLogEntry } from "./log.actions.ts";
import { PestDashboard } from "./pests.client.tsx";
import { RouteSlideOver } from "../components/route-slide-over.client.tsx";

const Component = async () => {
  const allPests = await db
    .select()
    .from(pestDisease)
    .orderBy(sql`${pestDisease.type} ASC, ${pestDisease.name} ASC`);

  const activePlantNames = await db
    .select({ name: plants.name })
    .from(plantings)
    .innerJoin(plants, eq(plantings.plantId, plants.id))
    .where(sql`${plantings.status} != 'done'`);
  const uniquePlantNames = [...new Set(activePlantNames.map((p) => p.name))].sort();

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
    <RouteSlideOver title="Pests & Diseases" width="w-[640px]">
      <div className="p-5">
        <PestDashboard
          pests={allPests}
          plantNames={uniquePlantNames}
          seasonalAlertIds={seasonalAlertIds}
          symptomList={symptomList}
          currentMonth={currentMonth}
          logAction={createLogEntry}
        />
      </div>
    </RouteSlideOver>
  );
};

export default Component;
