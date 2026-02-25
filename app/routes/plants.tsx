import { Link } from "react-flight-router/client";
import { db } from "../db/index.ts";
import { plants, plantings, settings, yardElements } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { PlantSearch } from "./plants.client.tsx";

const Component = async () => {
  const allPlants = await db.select().from(plants);
  const userSettings = (await db.select().from(settings).limit(1))[0];

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Plant Library</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Plant Library</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse {allPlants.length} plants with planting schedules for your zone.
        </p>
      </div>

      <PlantSearch
        plants={allPlants}
        lastFrostDate={lastFrostDate}
        activePlantings={activePlantings}
      />
    </main>
  );
};

export default Component;
