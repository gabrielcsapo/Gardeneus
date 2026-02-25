import { Link } from "react-flight-router/client";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { settings, plantings, plants, yardElements } from "../db/schema.ts";
import { markCalendarTaskDone } from "./calendar.actions.ts";
import { exportAllPlantings } from "./export.actions.ts";
import { getMoonPhase } from "../lib/moon-phases.ts";
import { GanttCalendar, MoonPhaseCard, ExportButton } from "./calendar.client.tsx";

const Component = async () => {
  const userSettings = (await db.select().from(settings).limit(1))[0];

  if (!userSettings?.lastFrostDate) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">Calendar</span>
        </nav>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Frost Dates Required</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Configure your frost dates in settings to see your planting calendar.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-garden-700 transition-colors no-underline"
          >
            Go to Settings
          </Link>
        </div>
      </main>
    );
  }

  const activePlantings = await db
    .select({
      id: plantings.id,
      plantId: plantings.plantId,
      status: plantings.status,
      plantedDate: plantings.plantedDate,
      yardElementId: plantings.yardElementId,
      quantity: plantings.quantity,
      plantName: plants.name,
      plantVariety: plants.variety,
      category: plants.category,
      indoorStartWeeks: plants.indoorStartWeeksBeforeFrost,
      directSowWeeks: plants.directSowWeeksBeforeFrost,
      transplantWeeks: plants.transplantWeeksAfterFrost,
      daysToHarvest: plants.daysToHarvest,
      bedLabel: yardElements.label,
      bedShapeType: yardElements.shapeType,
    })
    .from(plantings)
    .innerJoin(plants, eq(plantings.plantId, plants.id))
    .innerJoin(yardElements, eq(plantings.yardElementId, yardElements.id))
    .where(sql`${plantings.status} != 'done'`);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Calendar</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Planting Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your personalized planting schedule based on frost dates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MoonPhaseCard moonPhase={getMoonPhase()} />
          <ExportButton exportAction={exportAllPlantings} label="Export" />
        </div>
      </div>

      <GanttCalendar
        plantings={activePlantings}
        lastFrostDate={userSettings.lastFrostDate}
        firstFrostDate={userSettings.firstFrostDate}
        markDoneAction={markCalendarTaskDone}
      />
    </main>
  );
};

export default Component;
