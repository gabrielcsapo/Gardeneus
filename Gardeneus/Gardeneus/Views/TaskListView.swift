import SwiftUI
import SwiftData

struct TaskListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \GardenTask.dueDate) private var tasks: [GardenTask]
    @Query private var elements: [YardElement]

    @State private var filter: TaskFilter = .pending
    @State private var showingAddTask = false
    @State private var selectedTask: GardenTask?

    private enum TaskFilter: String, CaseIterable {
        case pending = "Pending"
        case completed = "Completed"
        case all = "All"
    }

    private var filteredTasks: [GardenTask] {
        switch filter {
        case .pending: return tasks.filter { $0.completedAt == nil }
        case .completed: return tasks.filter { $0.completedAt != nil }
        case .all: return Array(tasks)
        }
    }

    private var today: String {
        ISO8601DateFormatter().string(from: Date()).components(separatedBy: "T").first ?? ""
    }

    private var overdueTasks: [GardenTask] {
        filteredTasks.filter { $0.completedAt == nil && ($0.dueDate ?? "") < today && $0.dueDate != nil }
    }

    private var todayTasks: [GardenTask] {
        filteredTasks.filter { $0.completedAt == nil && $0.dueDate == today }
    }

    private var upcomingTasks: [GardenTask] {
        filteredTasks.filter {
            $0.completedAt == nil && (($0.dueDate ?? "") > today || $0.dueDate == nil)
        }
    }

    private var completedTasks: [GardenTask] {
        filteredTasks.filter { $0.completedAt != nil }
    }

    var body: some View {
        NavigationStack {
            List {
                // Filter picker
                Picker("Filter", selection: $filter) {
                    ForEach(TaskFilter.allCases, id: \.self) { f in
                        Text(f.rawValue).tag(f)
                    }
                }
                .pickerStyle(.segmented)
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)

                if filter != .completed {
                    if !overdueTasks.isEmpty {
                        taskSection("Overdue", tasks: overdueTasks, color: .red)
                    }
                    if !todayTasks.isEmpty {
                        taskSection("Today", tasks: todayTasks, color: .garden500)
                    }
                    if !upcomingTasks.isEmpty {
                        taskSection("Upcoming", tasks: upcomingTasks, color: .secondary)
                    }
                }

                if filter != .pending && !completedTasks.isEmpty {
                    taskSection("Completed", tasks: completedTasks, color: .secondary)
                }

                if filteredTasks.isEmpty {
                    ContentUnavailableView {
                        Label(
                            filter == .pending ? "All Caught Up!" : "No Tasks",
                            systemImage: "checkmark.circle"
                        )
                    } description: {
                        Text(filter == .pending
                            ? "No pending tasks. Tap + to add a new one."
                            : "No tasks found.")
                    }
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                }
            }
            .listStyle(.plain)
            .navigationTitle("Tasks")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingAddTask = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddTask) {
                AddTaskSheet()
            }
            .sheet(isPresented: Binding(
                get: { selectedTask != nil },
                set: { if !$0 { selectedTask = nil } }
            )) {
                if let task = selectedTask {
                    EditTaskSheet(task: task, elements: Array(elements), onDelete: {
                        modelContext.delete(task)
                        selectedTask = nil
                    })
                }
            }
        }
    }

    private func taskSection(_ title: String, tasks: [GardenTask], color: Color) -> some View {
        Section {
            ForEach(tasks, id: \.id) { task in
                TaskRow(task: task, elements: elements, today: today) {
                    selectedTask = task
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        modelContext.delete(task)
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
                .swipeActions(edge: .leading, allowsFullSwipe: true) {
                    Button {
                        toggleComplete(task)
                    } label: {
                        Label(
                            task.completedAt == nil ? "Complete" : "Reopen",
                            systemImage: task.completedAt == nil ? "checkmark.circle.fill" : "arrow.uturn.backward"
                        )
                    }
                    .tint(task.completedAt == nil ? .garden500 : .orange)
                }
            }
        } header: {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(color)
                .textCase(.uppercase)
        }
    }

    private func toggleComplete(_ task: GardenTask) {
        if task.completedAt != nil {
            task.completedAt = nil
        } else {
            task.completedAt = ISO8601DateFormatter().string(from: Date())
        }
        task.updatedAt = ISO8601DateFormatter().string(from: Date())
    }
}

// MARK: - Task Row

private struct TaskRow: View {
    let task: GardenTask
    let elements: [YardElement]
    let today: String
    let onTap: () -> Void

    private var isOverdue: Bool {
        task.completedAt == nil && (task.dueDate ?? "") < today && task.dueDate != nil
    }

    private var isToday: Bool {
        task.dueDate == today
    }

    private var bedLabel: String? {
        guard let bedId = task.yardElementServerId,
              let el = elements.first(where: { $0.serverId == bedId }) else { return nil }
        return el.label ?? "Bed #\(bedId)"
    }

    private var typeColor: Color {
        switch task.taskType {
        case "indoor_start": return .blue
        case "direct_sow": return .green
        case "transplant": return .orange
        case "harvest": return .yellow
        case "watering": return .cyan
        default: return .gray
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Completion indicator
                Image(systemName: task.completedAt != nil ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(task.completedAt != nil ? Color.garden500 : .secondary)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 3) {
                    Text(task.title)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(task.completedAt != nil ? .secondary : .primary)
                        .strikethrough(task.completedAt != nil)

                    HStack(spacing: 6) {
                        if let dueDate = task.dueDate {
                            HStack(spacing: 2) {
                                Image(systemName: "calendar")
                                    .font(.caption2)
                                Text(isToday ? "Today" : formatDate(dueDate))
                                    .font(.caption)
                            }
                            .foregroundStyle(isOverdue ? .red : isToday ? Color.garden600 : .secondary)
                            .fontWeight(isOverdue || isToday ? .medium : .regular)
                        }

                        if let recurrence = task.recurrence {
                            HStack(spacing: 2) {
                                Image(systemName: "repeat")
                                    .font(.caption2)
                                Text(recurrenceLabel(recurrence))
                                    .font(.caption)
                            }
                            .foregroundStyle(.secondary)
                        }

                        if let bed = bedLabel {
                            Text(bed)
                                .font(.caption)
                                .foregroundStyle(Color.garden700)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 1)
                                .background(Color.garden100, in: Capsule())
                        }
                    }
                }

                Spacer()

                if let taskType = task.taskType {
                    Text(taskType.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.caption2.weight(.medium))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(typeColor.opacity(0.15), in: Capsule())
                        .foregroundStyle(typeColor)
                }

                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }

    private func formatDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateStr) else { return dateStr }
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }

    private func recurrenceLabel(_ r: String) -> String {
        switch r {
        case "daily": return "Daily"
        case "weekly": return "Weekly"
        case "biweekly": return "Bi-weekly"
        case "monthly": return "Monthly"
        default: return r.capitalized
        }
    }
}

// MARK: - Add Task Sheet

private struct AddTaskSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var description = ""
    @State private var dueDate = Date()
    @State private var hasDueDate = false
    @State private var recurrence = ""
    @State private var taskType = ""

    private let taskTypes = ["", "indoor_start", "direct_sow", "transplant", "harvest", "watering"]
    private let recurrences = ["", "daily", "weekly", "biweekly", "monthly"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    TextField("What needs to be done?", text: $title)
                    TextField("Notes (optional)", text: $description, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section("Schedule") {
                    Toggle("Due date", isOn: $hasDueDate)
                    if hasDueDate {
                        DatePicker("Date", selection: $dueDate, displayedComponents: .date)
                    }

                    Picker("Repeat", selection: $recurrence) {
                        Text("No repeat").tag("")
                        Text("Daily").tag("daily")
                        Text("Weekly").tag("weekly")
                        Text("Every 2 weeks").tag("biweekly")
                        Text("Monthly").tag("monthly")
                    }
                }

                Section("Type") {
                    Picker("Task type", selection: $taskType) {
                        Text("General").tag("")
                        Text("Indoor Start").tag("indoor_start")
                        Text("Direct Sow").tag("direct_sow")
                        Text("Transplant").tag("transplant")
                        Text("Harvest").tag("harvest")
                        Text("Watering").tag("watering")
                    }
                }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        saveTask()
                        dismiss()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func saveTask() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let task = GardenTask(
            title: title.trimmingCharacters(in: .whitespaces),
            taskDescription: description.isEmpty ? nil : description,
            dueDate: hasDueDate ? formatter.string(from: dueDate) : nil,
            recurrence: recurrence.isEmpty ? nil : recurrence,
            taskType: taskType.isEmpty ? nil : taskType,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        modelContext.insert(task)
    }
}

// MARK: - Edit Task Sheet

private struct EditTaskSheet: View {
    @Environment(\.dismiss) private var dismiss
    let task: GardenTask
    let elements: [YardElement]
    let onDelete: () -> Void

    @State private var editedTitle: String
    @State private var editedDescription: String
    @State private var editedDueDate: Date
    @State private var hasDueDate: Bool
    @State private var editedRecurrence: String
    @State private var editedTaskType: String
    @State private var hasChanges = false

    init(task: GardenTask, elements: [YardElement], onDelete: @escaping () -> Void) {
        self.task = task
        self.elements = elements
        self.onDelete = onDelete
        _editedTitle = State(initialValue: task.title)
        _editedDescription = State(initialValue: task.taskDescription ?? "")
        _hasDueDate = State(initialValue: task.dueDate != nil)

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        _editedDueDate = State(initialValue: task.dueDate.flatMap { formatter.date(from: $0) } ?? Date())

        _editedRecurrence = State(initialValue: task.recurrence ?? "")
        _editedTaskType = State(initialValue: task.taskType ?? "")
    }

    private var bedLabel: String? {
        guard let bedId = task.yardElementServerId,
              let el = elements.first(where: { $0.serverId == bedId }) else { return nil }
        return el.label ?? "Bed #\(bedId)"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    TextField("Title", text: $editedTitle)
                        .onChange(of: editedTitle) { _, _ in hasChanges = true }

                    TextField("Notes", text: $editedDescription, axis: .vertical)
                        .lineLimit(2...6)
                        .onChange(of: editedDescription) { _, _ in hasChanges = true }
                }

                Section("Schedule") {
                    Toggle("Due date", isOn: $hasDueDate)
                        .onChange(of: hasDueDate) { _, _ in hasChanges = true }

                    if hasDueDate {
                        DatePicker("Date", selection: $editedDueDate, displayedComponents: .date)
                            .onChange(of: editedDueDate) { _, _ in hasChanges = true }
                    }

                    Picker("Repeat", selection: $editedRecurrence) {
                        Text("No repeat").tag("")
                        Text("Daily").tag("daily")
                        Text("Weekly").tag("weekly")
                        Text("Every 2 weeks").tag("biweekly")
                        Text("Monthly").tag("monthly")
                    }
                    .onChange(of: editedRecurrence) { _, _ in hasChanges = true }
                }

                Section("Type") {
                    Picker("Task type", selection: $editedTaskType) {
                        Text("General").tag("")
                        Text("Indoor Start").tag("indoor_start")
                        Text("Direct Sow").tag("direct_sow")
                        Text("Transplant").tag("transplant")
                        Text("Harvest").tag("harvest")
                        Text("Watering").tag("watering")
                    }
                    .onChange(of: editedTaskType) { _, _ in hasChanges = true }
                }

                if let bed = bedLabel {
                    Section("Location") {
                        HStack {
                            Image(systemName: "square.grid.2x2")
                                .foregroundStyle(Color.garden600)
                            Text(bed)
                        }
                    }
                }

                // Status
                Section {
                    Button {
                        if task.completedAt != nil {
                            task.completedAt = nil
                        } else {
                            task.completedAt = ISO8601DateFormatter().string(from: Date())
                        }
                        task.updatedAt = ISO8601DateFormatter().string(from: Date())
                        dismiss()
                    } label: {
                        HStack {
                            Spacer()
                            Label(
                                task.completedAt == nil ? "Mark Complete" : "Reopen Task",
                                systemImage: task.completedAt == nil ? "checkmark.circle.fill" : "arrow.uturn.backward"
                            )
                            .font(.subheadline.weight(.medium))
                            Spacer()
                        }
                    }
                    .tint(task.completedAt == nil ? .garden500 : .orange)
                }

                Section {
                    Button(role: .destructive) {
                        onDelete()
                        dismiss()
                    } label: {
                        HStack {
                            Spacer()
                            Label("Delete Task", systemImage: "trash")
                                .font(.subheadline.weight(.medium))
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveChanges()
                        dismiss()
                    }
                    .disabled(!hasChanges)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func saveChanges() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        task.title = editedTitle.trimmingCharacters(in: .whitespaces)
        task.taskDescription = editedDescription.isEmpty ? nil : editedDescription
        task.dueDate = hasDueDate ? formatter.string(from: editedDueDate) : nil
        task.recurrence = editedRecurrence.isEmpty ? nil : editedRecurrence
        task.taskType = editedTaskType.isEmpty ? nil : editedTaskType
        task.updatedAt = ISO8601DateFormatter().string(from: Date())
    }
}
