import SwiftUI
import SwiftData

struct CalendarView: View {
    @Query private var settings: [Settings]
    @Query private var plantings: [Planting]
    @Query private var plants: [Plant]
    @Query private var tasks: [GardenTask]

    @State private var selectedMonth = Calendar.current.component(.month, from: Date())
    @State private var selectedYear = Calendar.current.component(.year, from: Date())

    private var userSettings: Settings? { settings.first }

    private var activePlantings: [Planting] {
        plantings.filter { $0.status != "done" && $0.status != "removed" }
    }

    private var monthTasks: [GardenTask] {
        let prefix = String(format: "%04d-%02d", selectedYear, selectedMonth)
        return tasks.filter { ($0.dueDate ?? "").hasPrefix(prefix) && $0.completedAt == nil }
    }

    private var monthName: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        var components = DateComponents()
        components.year = selectedYear
        components.month = selectedMonth
        components.day = 1
        if let date = Calendar.current.date(from: components) {
            return formatter.string(from: date)
        }
        return ""
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Month navigator
                    HStack {
                        Button {
                            goBack()
                        } label: {
                            Image(systemName: "chevron.left")
                        }

                        Spacer()
                        Text(monthName)
                            .font(.headline)
                        Spacer()

                        Button {
                            goForward()
                        } label: {
                            Image(systemName: "chevron.right")
                        }
                    }
                    .padding(.horizontal)

                    // Frost dates info
                    if let settings = userSettings {
                        frostDatesCard(settings)
                    }

                    // Planting timeline
                    if !activePlantings.isEmpty {
                        plantingTimeline
                    }

                    // Tasks for this month
                    if !monthTasks.isEmpty {
                        tasksList
                    }

                    // Empty state
                    if activePlantings.isEmpty && monthTasks.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "calendar.badge.plus")
                                .font(.system(size: 36))
                                .foregroundStyle(.secondary)
                            Text("No plantings or tasks this month")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 40)
                    }
                }
                .padding()
            }
            .navigationTitle("Calendar")
        }
    }

    // MARK: - Frost Dates Card

    private func frostDatesCard(_ s: Settings) -> some View {
        HStack(spacing: 16) {
            if let last = s.lastFrostDate {
                VStack(spacing: 4) {
                    Image(systemName: "snowflake")
                        .foregroundStyle(.blue)
                    Text("Last Frost")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(last)
                        .font(.caption.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
            }

            if let first = s.firstFrostDate {
                VStack(spacing: 4) {
                    Image(systemName: "snowflake.circle.fill")
                        .foregroundStyle(.cyan)
                    Text("First Frost")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(first)
                        .font(.caption.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
            }

            if let zone = s.zone {
                VStack(spacing: 4) {
                    Image(systemName: "map")
                        .foregroundStyle(.gardenGreen)
                    Text("Zone")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(zone)
                        .font(.caption.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Planting Timeline

    private var plantingTimeline: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Active Plantings")
                .font(.headline)
                .padding(.horizontal, 4)

            ForEach(activePlantings, id: \.id) { planting in
                let plant = plants.first { $0.serverId == planting.plantServerId }
                HStack(spacing: 12) {
                    Circle()
                        .fill(statusColor(planting.status))
                        .frame(width: 10, height: 10)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(plant?.name ?? "Unknown")
                            .font(.subheadline.weight(.medium))
                        HStack(spacing: 8) {
                            if let status = planting.status {
                                Text(status.capitalized)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            if let date = planting.plantedDate {
                                Text("Planted \(date)")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }

                    Spacer()

                    if let dth = plant?.daysToHarvest, dth > 0 {
                        Text("\(dth)d")
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(.orange.opacity(0.15), in: Capsule())
                            .foregroundStyle(.orange)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Tasks List

    private var tasksList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tasks This Month (\(monthTasks.count))")
                .font(.headline)
                .padding(.horizontal, 4)

            ForEach(monthTasks, id: \.id) { task in
                HStack(spacing: 12) {
                    Image(systemName: "circle")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(task.title)
                            .font(.subheadline)
                        if let due = task.dueDate {
                            Text(due)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Navigation

    private func goBack() {
        if selectedMonth == 1 {
            selectedMonth = 12
            selectedYear -= 1
        } else {
            selectedMonth -= 1
        }
    }

    private func goForward() {
        if selectedMonth == 12 {
            selectedMonth = 1
            selectedYear += 1
        } else {
            selectedMonth += 1
        }
    }

    private func statusColor(_ status: String?) -> Color {
        switch status {
        case "planted": return .garden500
        case "germinated": return .garden400
        case "growing": return .garden600
        case "harvesting": return .orange
        case "planned": return .blue
        default: return .gray
        }
    }
}
