import { db } from "../db/index.ts";
import { tasks, yardElements } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { generateTasksForPlantings } from "../lib/task-generator.ts";
import { createTask, completeTask, uncompleteTask, deleteTask, updateTask } from "./tasks.actions.ts";
import { TaskList, AddTaskForm } from "./tasks.client.tsx";
import { RouteSlideOver } from "../components/route-slide-over.client.tsx";

const Component = async () => {
  await generateTasksForPlantings();

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

  return (
    <RouteSlideOver title="Tasks" width="w-[580px]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage garden tasks and track your to-do list.
          </p>
          <AddTaskForm createAction={createTask} />
        </div>
        <TaskList
          tasks={allTasks}
          completeAction={completeTask}
          uncompleteAction={uncompleteTask}
          deleteAction={deleteTask}
          updateAction={updateTask}
        />
      </div>
    </RouteSlideOver>
  );
};

export default Component;
