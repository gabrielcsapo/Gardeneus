import { Link } from "react-flight-router/client";
import { db } from "../db/index.ts";
import { tasks, yardElements } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { generateTasksForPlantings } from "../lib/task-generator.ts";
import { createTask, completeTask, uncompleteTask, deleteTask, updateTask } from "./tasks.actions.ts";
import { TaskList, AddTaskForm } from "./tasks.client.tsx";

const Component = async () => {
  // Auto-generate tasks from plantings
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
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Tasks</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage garden tasks and track your to-do list.
          </p>
        </div>
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
    </main>
  );
};

export default Component;
