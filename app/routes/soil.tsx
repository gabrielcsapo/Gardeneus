import { Link } from "react-router";
import { db } from "../db/index.ts";
import { soilProfiles, yardElements } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { addSoilProfile, deleteSoilProfile } from "./soil.actions.ts";
import { SoilProfileList } from "./soil.client.tsx";

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
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Soil Health</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Soil Health</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track soil test results and monitor nutrient levels per bed.
        </p>
      </div>

      <SoilProfileList
        profiles={profiles}
        beds={beds}
        addAction={addSoilProfile}
        deleteAction={deleteSoilProfile}
      />
    </main>
  );
};

export default Component;
