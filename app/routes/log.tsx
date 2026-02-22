import { Link } from "react-router";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.ts";
import { logEntries, plantings, plants, yardElements } from "../db/schema.ts";
import { createLogEntry, updateLogEntry, deleteLogEntry } from "./log.actions.ts";
import { exportLogs } from "./export.actions.ts";
import { InteractiveLog, ExportButton } from "./log.client.tsx";

const Component = async () => {
  const entries = await db
    .select({
      id: logEntries.id,
      date: logEntries.date,
      type: logEntries.type,
      content: logEntries.content,
      stage: logEntries.stage,
      yieldAmount: logEntries.yieldAmount,
      yieldUnit: logEntries.yieldUnit,
      photoPath: logEntries.photoPath,
      plantingId: logEntries.plantingId,
      yardElementId: logEntries.yardElementId,
      plantName: plants.name,
      plantVariety: plants.variety,
      bedLabel: yardElements.label,
      bedShapeType: yardElements.shapeType,
    })
    .from(logEntries)
    .leftJoin(plantings, eq(logEntries.plantingId, plantings.id))
    .leftJoin(plants, eq(plantings.plantId, plants.id))
    .leftJoin(yardElements, eq(logEntries.yardElementId, yardElements.id))
    .orderBy(desc(logEntries.date), desc(logEntries.id));

  const allPlantings = await db
    .select({
      id: plantings.id,
      plantName: plants.name,
      plantVariety: plants.variety,
      yardElementId: plantings.yardElementId,
      bedLabel: yardElements.label,
    })
    .from(plantings)
    .innerJoin(plants, eq(plantings.plantId, plants.id))
    .innerJoin(yardElements, eq(plantings.yardElementId, yardElements.id));

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Garden Log</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Garden Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track activities, observations, and harvests in your garden.
          </p>
        </div>
        <ExportButton exportAction={exportLogs} label="Export CSV" />
      </div>

      <InteractiveLog
        entries={entries}
        plantings={allPlantings}
        createAction={createLogEntry}
        updateAction={updateLogEntry}
        deleteAction={deleteLogEntry}
      />
    </main>
  );
};

export default Component;
