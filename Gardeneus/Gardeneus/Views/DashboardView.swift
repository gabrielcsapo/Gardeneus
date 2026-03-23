import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(ServerDiscovery.self) private var serverDiscovery

    @Query private var settings: [Settings]
    @Query private var yards: [Yard]
    @Query private var plantings: [Planting]
    @Query private var tasks: [GardenTask]
    @Query(sort: \LogEntry.date, order: .reverse) private var logEntries: [LogEntry]

    var syncEngine: SyncEngine?
    @State private var isSyncing = false

    private var userSettings: Settings? { settings.first }
    private var activePlantings: [Planting] {
        plantings.filter { $0.status != "done" && $0.status != "removed" }
    }
    private var pendingTasks: [GardenTask] {
        tasks.filter { $0.completedAt == nil }.sorted {
            ($0.dueDate ?? "") < ($1.dueDate ?? "")
        }
    }
    private var recentLogs: [LogEntry] {
        Array(logEntries.prefix(5))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Sync banner
                    SyncBannerView(syncEngine: syncEngine, isConnected: serverDiscovery.isConnected)
                        .animation(.easeInOut(duration: 0.2), value: syncEngine?.isSyncing)

                    // Sync status card
                    syncStatusCard

                    // Stats row
                    statsRow

                    // Pending tasks
                    if !pendingTasks.isEmpty {
                        tasksSection
                    }

                    // Recent activity
                    if !recentLogs.isEmpty {
                        recentActivitySection
                    }

                    // Empty state
                    if yards.isEmpty && plantings.isEmpty {
                        emptyState
                    }
                }
                .padding()
            }
            .refreshable {
                await performSync()
            }
            .navigationTitle("Gardeneus")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await performSync() }
                    } label: {
                        if isSyncing {
                            ProgressView()
                                .controlSize(.small)
                        } else {
                            Image(systemName: "arrow.triangle.2.circlepath")
                        }
                    }
                    .disabled(isSyncing || !serverDiscovery.isConnected)
                }
            }
        }
    }

    // MARK: - Sync Status

    private var syncStatusCard: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(serverDiscovery.isConnected ? Color.green : Color.red)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(serverDiscovery.isConnected ? "Connected" : "Offline")
                    .font(.subheadline.weight(.medium))
                if let relative = syncEngine?.lastSyncRelative {
                    Text("Synced \(relative)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Never synced")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if serverDiscovery.isConnected {
                Button("Sync Now") {
                    Task { await performSync() }
                }
                .font(.caption.weight(.medium))
                .buttonStyle(.bordered)
                .tint(.gardenGreen)
                .disabled(isSyncing)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Stats

    private var statsRow: some View {
        HStack(spacing: 12) {
            StatCard(title: "Yards", value: "\(yards.count)", icon: "square.grid.2x2.fill", color: .garden500)
            StatCard(title: "Active", value: "\(activePlantings.count)", icon: "leaf.fill", color: .garden600)
            StatCard(title: "Tasks", value: "\(pendingTasks.count)", icon: "checklist", color: .orange)
            StatCard(title: "Logs", value: "\(logEntries.count)", icon: "note.text", color: .blue)
        }
    }

    // MARK: - Tasks

    private var tasksSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Upcoming Tasks")
                .font(.headline)
                .padding(.horizontal, 4)

            ForEach(Array(pendingTasks.prefix(5)), id: \.id) { task in
                HStack(spacing: 12) {
                    Image(systemName: iconForTaskType(task.taskType))
                        .foregroundStyle(.gardenGreen)
                        .frame(width: 24)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(task.title)
                            .font(.subheadline.weight(.medium))
                        if let due = task.dueDate {
                            Text(due)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    Button {
                        task.completedAt = ISO8601DateFormatter().string(from: Date())
                    } label: {
                        Image(systemName: "checkmark.circle")
                            .foregroundStyle(.gardenGreen)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Recent Activity

    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Activity")
                .font(.headline)
                .padding(.horizontal, 4)

            ForEach(recentLogs, id: \.id) { log in
                HStack(spacing: 12) {
                    Image(systemName: iconForLogType(log.type))
                        .foregroundStyle(colorForLogType(log.type))
                        .frame(width: 24)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(log.content ?? log.type ?? "Log")
                            .font(.subheadline)
                            .lineLimit(1)
                        Text(log.date ?? "")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "leaf.circle")
                .font(.system(size: 48))
                .foregroundStyle(.gardenGreen)
            Text("Welcome to Gardeneus")
                .font(.title3.weight(.semibold))
            Text("Connect to your garden server and sync to get started.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Helpers

    private func performSync() async {
        guard let syncEngine else { return }
        isSyncing = true
        defer { isSyncing = false }
        do {
            try await syncEngine.fullSync()
        } catch {
            print("Sync error: \(error)")
        }
    }

    private func iconForTaskType(_ type: String?) -> String {
        switch type {
        case "water": return "drop.fill"
        case "harvest": return "basket.fill"
        case "plant": return "leaf.fill"
        case "fertilize": return "sparkles"
        case "prune": return "scissors"
        default: return "checklist"
        }
    }

    private func iconForLogType(_ type: String?) -> String {
        switch type {
        case "planting": return "leaf.fill"
        case "harvest": return "basket.fill"
        case "observation": return "eye.fill"
        case "maintenance": return "wrench.fill"
        case "pest": return "ladybug.fill"
        case "weather": return "cloud.sun.fill"
        default: return "note.text"
        }
    }

    private func colorForLogType(_ type: String?) -> Color {
        switch type {
        case "planting": return .garden500
        case "harvest": return .orange
        case "observation": return .blue
        case "maintenance": return .purple
        case "pest": return .red
        case "weather": return .cyan
        default: return .gray
        }
    }
}

// MARK: - Stat Card

private struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.title2.weight(.bold))
                .foregroundStyle(.primary)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
