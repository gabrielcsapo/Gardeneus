"use client";

import React from "react";
import { useSearchParams } from "react-router";
import { useToast } from "../components/toast.client";

type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  recurrence: string | null;
  completedAt: string | null;
  taskType: string | null;
  bedLabel: string | null;
};

const TASK_TYPE_COLORS: Record<string, string> = {
  indoor_start: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  direct_sow: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  transplant: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  harvest: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  watering: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  custom: "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export function TaskList({
  tasks,
  completeAction,
  uncompleteAction,
  deleteAction,
  updateAction,
}: {
  tasks: Task[];
  completeAction: (formData: FormData) => Promise<{ success: boolean }>;
  uncompleteAction: (formData: FormData) => Promise<{ success: boolean }>;
  deleteAction: (formData: FormData) => Promise<{ success: boolean }>;
  updateAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get("filter") as "pending" | "completed" | "all") || "pending";
  const setFilter = (f: "pending" | "completed" | "all") => {
    if (f === "pending") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ filter: f }, { replace: true });
    }
  };
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const { addToast } = useToast();

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completedAt;
    if (filter === "completed") return !!t.completedAt;
    return true;
  });

  const today = new Date().toISOString().split("T")[0];

  const overdue = filtered.filter((t) => {
    if (t.completedAt || !t.dueDate) return false;
    return t.dueDate < today;
  });

  const todayTasks = filtered.filter((t) => {
    if (t.completedAt || !t.dueDate) return false;
    return t.dueDate === today;
  });

  const upcoming = filtered.filter((t) => {
    if (t.completedAt) return false;
    if (!t.dueDate) return true;
    return t.dueDate > today;
  });

  const completed = filtered.filter((t) => !!t.completedAt);

  async function handleComplete(task: Task) {
    const fd = new FormData();
    fd.set("id", String(task.id));
    const action = task.completedAt ? uncompleteAction : completeAction;
    await action(fd);
    addToast(task.completedAt ? "Task reopened" : "Task completed!", "success");
  }

  async function handleDelete(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    await deleteAction(fd);
    addToast("Task deleted", "info");
    if (editingId === id) setEditingId(null);
  }

  async function handleUpdate(id: number, updates: Record<string, string>) {
    const fd = new FormData();
    fd.set("id", String(id));
    for (const [key, val] of Object.entries(updates)) {
      fd.set(key, val);
    }
    const result = await updateAction(fd);
    if (result.success) {
      addToast("Task updated", "success");
      setEditingId(null);
    } else {
      addToast(result.error ?? "Failed to update", "error");
    }
  }

  function renderSection(label: string, items: Task[], color: string) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${color}`}>
          {label} ({items.length})
        </h3>
        {items.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isEditing={editingId === task.id}
            isExpanded={expandedId === task.id}
            onStartEdit={() => setEditingId(task.id)}
            onStopEdit={() => setEditingId(null)}
            onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
            onComplete={() => handleComplete(task)}
            onDelete={() => handleDelete(task.id)}
            onUpdate={(updates) => handleUpdate(task.id, updates)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === f
                ? "bg-garden-50 text-garden-700 dark:bg-garden-900/30 dark:text-garden-400"
                : "text-gray-500 hover:text-gray-900 hover:bg-earth-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Task sections */}
      {filter !== "completed" && (
        <>
          {renderSection("Overdue", overdue, "text-red-600 dark:text-red-400")}
          {renderSection("Today", todayTasks, "text-garden-600 dark:text-garden-400")}
          {renderSection("Upcoming", upcoming, "text-gray-500 dark:text-gray-400")}
        </>
      )}
      {filter !== "pending" && renderSection("Completed", completed, "text-gray-400 dark:text-gray-500")}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-garden-300 dark:text-gray-600 mb-4" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M22 32l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32 8v4M32 52v4M8 32h4M52 32h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {filter === "pending" ? "All caught up!" : "No tasks found"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filter === "pending" ? "No pending tasks right now. Enjoy your garden!" : "Try adjusting your filters or add a new task."}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Task Card ---

function TaskCard({
  task,
  isEditing,
  isExpanded,
  onStartEdit,
  onStopEdit,
  onToggleExpand,
  onComplete,
  onDelete,
  onUpdate,
}: {
  task: Task;
  isEditing: boolean;
  isExpanded: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onToggleExpand: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onUpdate: (updates: Record<string, string>) => Promise<void>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completedAt && task.dueDate && task.dueDate < today;
  const isToday = task.dueDate === today;

  if (isEditing) {
    return (
      <InlineTaskEditor
        task={task}
        onSave={onUpdate}
        onCancel={onStopEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div
      className={`group rounded-lg card-hover ${
        task.completedAt
          ? "bg-gray-50 dark:bg-gray-700/30 opacity-60"
          : isOverdue
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            : isToday
              ? "bg-garden-50 dark:bg-garden-900/20 border border-garden-200 dark:border-garden-800"
              : "bg-earth-50 dark:bg-gray-700/50"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onComplete}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition shrink-0 ${
            task.completedAt
              ? "bg-garden-600 border-garden-600 text-white"
              : "border-gray-300 dark:border-gray-500 hover:border-garden-500"
          }`}
        >
          {task.completedAt && (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Title (click to edit) */}
        <button
          type="button"
          onClick={onStartEdit}
          className="flex-1 min-w-0 text-left cursor-pointer"
        >
          <p className={`text-sm font-medium ${task.completedAt ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.dueDate && (
              <span className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : isToday ? "text-garden-600 dark:text-garden-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                {isOverdue ? "Overdue: " : isToday ? "Today" : ""}
                {!isToday && new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            {task.recurrence && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {task.recurrence === "daily" ? "Daily" : task.recurrence === "weekly" ? "Weekly" : task.recurrence === "biweekly" ? "Bi-weekly" : "Monthly"}
              </span>
            )}
            {task.bedLabel && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{task.bedLabel}</span>
            )}
          </div>
        </button>

        {/* Task type badge */}
        {task.taskType && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${TASK_TYPE_COLORS[task.taskType] ?? TASK_TYPE_COLORS.custom}`}>
            {task.taskType.replace("_", " ")}
          </span>
        )}

        {/* Expand/collapse description */}
        {task.description && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition"
            title={isExpanded ? "Collapse" : "Show notes"}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* Edit hint + delete */}
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded description */}
      {isExpanded && task.description && (
        <div className="px-3 pb-3 pl-11">
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
    </div>
  );
}

// --- Inline Task Editor ---

function InlineTaskEditor({
  task,
  onSave,
  onCancel,
  onDelete,
}: {
  task: Task;
  onSave: (updates: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [dueDate, setDueDate] = React.useState(task.dueDate ?? "");
  const [recurrence, setRecurrence] = React.useState(task.recurrence ?? "");
  const [saving, setSaving] = React.useState(false);
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description,
      dueDate,
      recurrence,
    });
    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <div
      className="rounded-lg border-2 border-garden-400 dark:border-garden-600 bg-white dark:bg-gray-800 shadow-md p-4 space-y-3 animate-[slideUp_0.1s_ease-out]"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Enter to save, Esc to cancel</span>
        <div className="flex items-center gap-1">
          {saving && <span className="text-xs text-garden-600 dark:text-garden-400 animate-pulse">Saving...</span>}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Repeat</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition"
          >
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Notes..."
        rows={2}
        className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-1 focus:ring-garden-500/20 focus:outline-none transition resize-none"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-garden-600 text-white text-sm font-medium hover:bg-garden-700 disabled:opacity-50 transition-colors cursor-pointer press"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- Add Task Form ---

export function AddTaskForm({
  createAction,
}: {
  createAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const { addToast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Task
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="bg-earth-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 animate-[slideUp_0.1s_ease-out]"
      onKeyDown={handleKeyDown}
      action={async (formData) => {
        const result = await createAction(formData);
        if (result.success) {
          setOpen(false);
          addToast("Task added!", "success");
        } else {
          addToast(result.error ?? "Failed to add task.", "error");
        }
      }}
    >
      <input
        name="title"
        type="text"
        placeholder="Task title..."
        required
        autoFocus
        className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="dueDate"
          type="date"
          className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
        />
        <select
          name="recurrence"
          className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition"
        >
          <option value="">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <textarea
        name="description"
        placeholder="Notes (optional)"
        rows={2}
        className="w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400 resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-garden-700 disabled:opacity-50 transition-colors cursor-pointer press"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
