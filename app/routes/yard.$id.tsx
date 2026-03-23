import { db } from "../db/index.ts";
import { yards, yardElements, plants, plantings, settings, tasks, logEntries, pestDisease } from "../db/schema.ts";
import { eq, inArray, desc, sql } from "drizzle-orm";
import { YardEditor } from "./yard.client.tsx";
import { GardenHub } from "./garden-hub.client.tsx";
import { GanttCalendar, MoonPhaseCard, ExportButton as CalendarExportButton } from "./calendar.client.tsx";
import { TaskList, AddTaskForm } from "./tasks.client.tsx";
import { PlantsPageTabs, PlantSearch } from "./plants.client.tsx";
import { PestDashboard } from "./pests.client.tsx";
import { InteractiveLog, ExportButton as LogExportButton } from "./log.client.tsx";
import { generateTasksForPlantings } from "../lib/task-generator.ts";
import { getMoonPhase } from "../lib/moon-phases.ts";
import { markCalendarTaskDone } from "./calendar.actions.ts";
import { exportAllPlantings } from "./export.actions.ts";
import { completeTask, uncompleteTask, deleteTask, updateTask, createTask } from "./tasks.actions.ts";
import { createLogEntry, updateLogEntry, deleteLogEntry } from "./log.actions.ts";
import { exportLogs } from "./export.actions.ts";

const Component = async ({ params }: { params: { id: string } }) => {
  const yardId = Number(params.id);

  await generateTasksForPlantings();

  const [yard, userSettings, allYards] = await Promise.all([
    db.select().from(yards).where(eq(yards.id, yardId)).then((r) => r[0]),
    db.select().from(settings).limit(1).then((r) => r[0]),
    db.select({ id: yards.id, name: yards.name }).from(yards),
  ]);

  if (!yard) {
    throw new Response("Yard not found", { status: 404 });
  }

  // ── Design section ──────────────────────────────────────────────
  const elements = await db.select().from(yardElements).where(eq(yardElements.yardId, yard.id));
  const elementIds = elements.map((e) => e.id);

  const allPlants = await db
    .select({
      id: plants.id,
      name: plants.name,
      variety: plants.variety,
      category: plants.category,
      spacingInches: plants.spacingInches,
      daysToHarvest: plants.daysToHarvest,
      sunRequirement: plants.sunRequirement,
      companions: plants.companions,
      incompatible: plants.incompatible,
    })
    .from(plants);

  let designPlantings: {
    id: number;
    plantId: number;
    yardElementId: number;
    status: string | null;
    quantity: number | null;
    notes: string | null;
    plantedDate: string | null;
  }[] = [];

  if (elementIds.length > 0) {
    designPlantings = await db
      .select({
        id: plantings.id,
        plantId: plantings.plantId,
        yardElementId: plantings.yardElementId,
        status: plantings.status,
        quantity: plantings.quantity,
        notes: plantings.notes,
        plantedDate: plantings.plantedDate,
      })
      .from(plantings)
      .where(inArray(plantings.yardElementId, elementIds));
  }

  // ── Calendar section ─────────────────────────────────────────────
  let calendarPlantings: {
    id: number;
    plantId: number;
    status: string | null;
    plantedDate: string | null;
    yardElementId: number;
    quantity: number | null;
    plantName: string;
    plantVariety: string | null;
    category: string | null;
    indoorStartWeeks: number | null;
    directSowWeeks: number | null;
    transplantWeeks: number | null;
    daysToHarvest: number | null;
    bedLabel: string | null;
    bedShapeType: string | null;
  }[] = [];

  if (elementIds.length > 0 && userSettings?.lastFrostDate) {
    calendarPlantings = await db
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
      .where(inArray(plantings.yardElementId, elementIds));
  }

  // Tasks (not scoped to yard — garden-wide list)
  const allTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      recurrence: tasks.recurrence,
      completedAt: tasks.completedAt,
      taskType: tasks.taskType,
      plantingId: tasks.plantingId,
      yardElementId: tasks.yardElementId,
      bedLabel: yardElements.label,
    })
    .from(tasks)
    .leftJoin(yardElements, eq(tasks.yardElementId, yardElements.id))
    .orderBy(sql`${tasks.completedAt} IS NOT NULL, ${tasks.dueDate} ASC`);

  // ── Log section ───────────────────────────────────────────────────
  let logEntriesData: {
    id: number;
    date: string;
    type: string;
    content: string | null;
    stage: string | null;
    yieldAmount: number | null;
    yieldUnit: string | null;
    photoPath: string | null;
    plantingId: number | null;
    yardElementId: number | null;
    plantName: string | null;
    plantVariety: string | null;
    bedLabel: string | null;
    bedShapeType: string | null;
  }[] = [];

  let logPlantings: {
    id: number;
    plantName: string;
    plantVariety: string | null;
    yardElementId: number;
    bedLabel: string | null;
  }[] = [];

  if (elementIds.length > 0) {
    logEntriesData = await db
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
      .where(inArray(logEntries.yardElementId, elementIds))
      .orderBy(desc(logEntries.date), desc(logEntries.id));

    logPlantings = await db
      .select({
        id: plantings.id,
        plantName: plants.name,
        plantVariety: plants.variety,
        yardElementId: plantings.yardElementId,
        bedLabel: yardElements.label,
      })
      .from(plantings)
      .innerJoin(plants, eq(plantings.plantId, plants.id))
      .innerJoin(yardElements, eq(plantings.yardElementId, yardElements.id))
      .where(inArray(plantings.yardElementId, elementIds));
  }

  // ── Plants section ────────────────────────────────────────────────
  const allPlantsForLibrary = await db.select().from(plants);

  const activePlantingsForLibrary = designPlantings.map((p) => {
    const plant = allPlants.find((pl) => pl.id === p.plantId);
    const element = elements.find((e) => e.id === p.yardElementId);
    return {
      plantId: p.plantId,
      plantName: plant?.name ?? null,
      bedLabel: element?.label ?? null,
      yardElementId: p.yardElementId,
    };
  });

  const allPests = await db
    .select()
    .from(pestDisease)
    .orderBy(sql`${pestDisease.type} ASC, ${pestDisease.name} ASC`);

  const activePlantNames = [
    ...new Set(activePlantingsForLibrary.map((p) => p.plantName).filter(Boolean) as string[]),
  ].sort();

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

  // ── Render ────────────────────────────────────────────────────────
  const calendarSection = userSettings?.lastFrostDate ? (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calendar</h1>
        <div className="flex items-center gap-3">
          <MoonPhaseCard moonPhase={getMoonPhase()} />
          <CalendarExportButton exportAction={exportAllPlantings} label="Export" />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
          <AddTaskForm createAction={createTask} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-5">
          <TaskList
            tasks={allTasks}
            completeAction={completeTask}
            uncompleteAction={uncompleteTask}
            deleteAction={deleteTask}
            updateAction={updateTask}
          />
        </div>
      </div>

      <GanttCalendar
        plantings={calendarPlantings}
        lastFrostDate={userSettings.lastFrostDate}
        firstFrostDate={userSettings.firstFrostDate}
        markDoneAction={markCalendarTaskDone}
      />
    </main>
  ) : (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-earth-200 dark:border-gray-700 shadow-sm p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Frost Dates Required</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configure your frost dates in settings to see your planting calendar.
        </p>
        <a
          href="/settings"
          className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-garden-700 transition-colors no-underline"
        >
          Go to Settings
        </a>
      </div>
    </main>
  );

  const plantsSection = (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Plants</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {allPlantsForLibrary.length} plants with planting schedules for your zone.
        </p>
      </div>
      <PlantsPageTabs
        plantsTab={
          <PlantSearch
            plants={allPlantsForLibrary}
            lastFrostDate={userSettings?.lastFrostDate ?? null}
            activePlantings={activePlantingsForLibrary}
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

  const logSection = (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Garden Log</h1>
        <LogExportButton exportAction={exportLogs} label="Export CSV" />
      </div>
      <InteractiveLog
        entries={logEntriesData}
        plantings={logPlantings}
        createAction={createLogEntry}
        updateAction={updateLogEntry}
        deleteAction={deleteLogEntry}
      />
    </main>
  );

  return (
    <GardenHub
      yardId={yard.id}
      yardName={yard.name}
      yards={allYards}
      designSection={
        <YardEditor
          yard={yard}
          elements={elements}
          plants={allPlants}
          plantings={designPlantings}
        />
      }
      calendarSection={calendarSection}
      logSection={logSection}
    />
  );
};

export default Component;
