import { db } from "../db/index.ts";
import { soilProfiles, yardElements } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { addSoilProfile, deleteSoilProfile } from "./soil.actions.ts";
import { SoilProfileList } from "./soil.client.tsx";
import { RouteSlideOver } from "../components/route-slide-over.client.tsx";

const Component = async () => {
  const profiles = await db
    .select({
      id: soilProfiles.id,
      yardElementId: soilProfiles.yardElementId,
      bedLabel: yardElements.label,
      testDate: soilProfiles.testDate,
      ph: soilProfiles.ph,
      nitrogenLevel: soilProfiles.nitrogenLevel,
      phosphorusLevel: soilProfiles.phosphorusLevel,
      potassiumLevel: soilProfiles.potassiumLevel,
      organicMatterPct: soilProfiles.organicMatterPct,
      soilType: soilProfiles.soilType,
      notes: soilProfiles.notes,
    })
    .from(soilProfiles)
    .leftJoin(yardElements, eq(soilProfiles.yardElementId, yardElements.id))
    .orderBy(sql`${soilProfiles.testDate} DESC`);

  const beds = await db
    .select({ id: yardElements.id, label: yardElements.label })
    .from(yardElements)
    .orderBy(sql`${yardElements.label} ASC`);

  return (
    <RouteSlideOver title="Soil Health" width="w-[580px]">
      <div className="p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Track soil test results and monitor nutrient levels per bed.
        </p>
        <SoilProfileList
          profiles={profiles}
          beds={beds}
          addAction={addSoilProfile}
          deleteAction={deleteSoilProfile}
        />
      </div>
    </RouteSlideOver>
  );
};

export default Component;
