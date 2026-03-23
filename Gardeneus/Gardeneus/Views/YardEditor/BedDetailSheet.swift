import SwiftUI
import SwiftData

struct BedDetailSheet: View {
    let element: YardElement

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @Query private var allPlantings: [Planting]
    @Query private var allPlants: [Plant]
    @Query(sort: \LogEntry.date, order: .reverse) private var allLogEntries: [LogEntry]

    @State private var showAddPlanting = false
    @State private var showAddLog = false
    @State private var logNotes = ""
    @State private var selectedLogType = "observation"

    private var plantings: [Planting] {
        guard let serverId = element.serverId else { return [] }
        return allPlantings.filter { $0.yardElementServerId == serverId && $0.status != "removed" }
    }

    private var activePlantings: [Planting] {
        plantings.filter { $0.status != "done" }
    }

    private var bedLogEntries: [LogEntry] {
        guard let serverId = element.serverId else { return [] }
        return allLogEntries.filter { $0.yardElementServerId == serverId }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    headerSection
                    propertiesSection
                    Divider()
                    plantingsSection
                    Divider()
                    activitySection
                }
                .padding()
            }
            .navigationTitle(element.label ?? "Bed Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $showAddPlanting) {
                PlantPickerSheet(plants: allPlants) { plant in
                    addPlanting(plant: plant)
                    showAddPlanting = false
                }
            }
            .sheet(isPresented: $showAddLog) {
                BedQuickLogSheet(
                    elementServerId: element.serverId,
                    bedLabel: element.label ?? "Bed #\(element.serverId ?? 0)",
                    initialType: selectedLogType
                )
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack(spacing: 16) {
            let spec = shapeConfig[element.shapeType]
            RoundedRectangle(cornerRadius: 8)
                .fill(spec?.fillColor.opacity(0.4) ?? Color.gray.opacity(0.2))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(spec?.borderColor ?? .gray, lineWidth: 1.5)
                )
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: spec?.icon ?? "rectangle")
                        .font(.title2)
                        .foregroundStyle(spec?.borderColor ?? .gray)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(element.label ?? "Bed #\(element.serverId ?? 0)")
                    .font(.title3.weight(.semibold))
                Text(spec?.label ?? element.shapeType.capitalized)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("\(element.width) x \(element.height) ft")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            Spacer()
        }
    }

    // MARK: - Properties

    private var propertiesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Properties")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                PropertyRow(label: "Sun", value: element.sunExposure?.capitalized ?? "Not set", icon: "sun.max.fill")

                if let ext = element.seasonExtension, ext != "none" {
                    PropertyRow(label: "Extension", value: ext.replacingOccurrences(of: "_", with: " ").capitalized, icon: "thermometer.snowflake")
                }

                if let irr = element.irrigationType, irr != "none" {
                    PropertyRow(label: "Irrigation", value: irr.replacingOccurrences(of: "_", with: " ").capitalized, icon: "drop.fill")
                }

                PropertyRow(label: "Mulched", value: element.mulched ? "Yes" : "No", icon: "leaf.fill")

                PropertyRow(label: "Rotation", value: "\(element.rotation)\u{00B0}", icon: "rotate.right")
            }
        }
    }

    // MARK: - Plantings

    private var plantingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Plantings")
                    .font(.headline)
                Spacer()
                if !plantings.isEmpty {
                    Text("\(activePlantings.count) active")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if plantings.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "leaf")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                        Text("No plantings in this bed")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 24)
                    Spacer()
                }
            } else {
                ForEach(plantings, id: \.id) { planting in
                    PlantingCard(planting: planting, plants: allPlants, onDelete: {
                        modelContext.delete(planting)
                    })
                }
            }

            Button {
                showAddPlanting = true
            } label: {
                Label("Add Plant", systemImage: "plus.circle")
                    .font(.subheadline.weight(.medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.garden50, in: RoundedRectangle(cornerRadius: 8))
            }
            .tint(.garden700)
        }
    }

    // MARK: - Activity Log

    private var activitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Activity")
                    .font(.headline)
                Spacer()
                if !bedLogEntries.isEmpty {
                    Text("\(bedLogEntries.count) entries")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            // Quick log buttons
            HStack(spacing: 8) {
                BedLogButton(icon: "drop.fill", label: "Water", color: .cyan) {
                    selectedLogType = "watering"
                    showAddLog = true
                }
                BedLogButton(icon: "eye.fill", label: "Observe", color: .blue) {
                    selectedLogType = "observation"
                    showAddLog = true
                }
                BedLogButton(icon: "basket.fill", label: "Harvest", color: .orange) {
                    selectedLogType = "harvest"
                    showAddLog = true
                }
                BedLogButton(icon: "wrench.fill", label: "Maintain", color: .purple) {
                    selectedLogType = "maintenance"
                    showAddLog = true
                }
            }

            // Recent log entries for this bed
            if bedLogEntries.isEmpty {
                Text("No activity logged for this bed")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            } else {
                ForEach(bedLogEntries.prefix(5), id: \.id) { entry in
                    HStack(spacing: 8) {
                        Circle()
                            .fill(colorForLogType(entry.type))
                            .frame(width: 8, height: 8)
                        Text(entry.type.capitalized)
                            .font(.caption.weight(.medium))
                        if let content = entry.content, !content.isEmpty {
                            Text(content)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Text(entry.date)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
    }

    private func colorForLogType(_ type: String) -> Color {
        switch type {
        case "planting": return .garden500
        case "harvest": return .orange
        case "observation": return .blue
        case "maintenance": return .purple
        case "watering": return .cyan
        case "pest": return .red
        case "weather": return .teal
        default: return .gray
        }
    }

    // MARK: - Add Planting

    private func addPlanting(plant: Plant) {
        guard let elementServerId = element.serverId else { return }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let planting = Planting(
            plantServerId: plant.serverId,
            yardElementServerId: elementServerId,
            plantedDate: formatter.string(from: Date()),
            status: "planned",
            quantity: 1,
            season: String(Calendar.current.component(.year, from: Date())),
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        modelContext.insert(planting)
    }
}

// MARK: - Planting Card (Editable)

private struct PlantingCard: View {
    @Bindable var planting: Planting
    let plants: [Plant]
    let onDelete: () -> Void

    @State private var isExpanded = false

    private static let statuses = ["planned", "planted", "germinated", "growing", "harvesting", "done"]

    private var plant: Plant? {
        plants.first { $0.serverId == planting.plantServerId }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Summary row — tap to expand
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack(spacing: 12) {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 10, height: 10)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(plant?.name ?? "Unknown Plant")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)

                        HStack(spacing: 6) {
                            Text((planting.status ?? "planned").capitalized)
                                .font(.caption)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(statusColor.opacity(0.15), in: Capsule())
                                .foregroundStyle(statusColor)

                            if planting.quantity > 1 {
                                Text("x\(planting.quantity)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            if let date = planting.plantedDate {
                                Text(date)
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                }
            }
            .buttonStyle(.plain)
            .padding(.vertical, 6)

            // Expanded editing controls
            if isExpanded {
                VStack(spacing: 14) {
                    Divider()

                    // Status picker
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Status")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Self.statuses, id: \.self) { status in
                                    Button {
                                        planting.status = status
                                        planting.updatedAt = ISO8601DateFormatter().string(from: Date())
                                    } label: {
                                        Text(status.capitalized)
                                            .font(.caption.weight(.medium))
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(
                                                planting.status == status
                                                    ? colorForStatus(status).opacity(0.2)
                                                    : Color(.tertiarySystemFill),
                                                in: Capsule()
                                            )
                                            .foregroundStyle(
                                                planting.status == status
                                                    ? colorForStatus(status)
                                                    : .secondary
                                            )
                                            .overlay(
                                                Capsule()
                                                    .stroke(planting.status == status ? colorForStatus(status) : .clear, lineWidth: 1)
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    // Quantity stepper
                    HStack {
                        Text("Quantity")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        HStack(spacing: 0) {
                            Button {
                                if planting.quantity > 1 {
                                    planting.quantity -= 1
                                    planting.updatedAt = ISO8601DateFormatter().string(from: Date())
                                }
                            } label: {
                                Image(systemName: "minus")
                                    .font(.caption.weight(.semibold))
                                    .frame(width: 32, height: 32)
                                    .background(Color(.tertiarySystemFill), in: UnevenRoundedRectangle(topLeadingRadius: 8, bottomLeadingRadius: 8))
                            }
                            .buttonStyle(.plain)
                            .disabled(planting.quantity <= 1)

                            Text("\(planting.quantity)")
                                .font(.subheadline.weight(.medium))
                                .frame(width: 40, height: 32)
                                .background(Color(.tertiarySystemFill).opacity(0.5))

                            Button {
                                planting.quantity += 1
                                planting.updatedAt = ISO8601DateFormatter().string(from: Date())
                            } label: {
                                Image(systemName: "plus")
                                    .font(.caption.weight(.semibold))
                                    .frame(width: 32, height: 32)
                                    .background(Color(.tertiarySystemFill), in: UnevenRoundedRectangle(bottomTrailingRadius: 8, topTrailingRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    // Notes
                    if let notes = planting.notes, !notes.isEmpty {
                        HStack {
                            Text("Notes")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(notes)
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                    }

                    // Plant info
                    if let plant {
                        HStack(spacing: 16) {
                            if let dth = plant.daysToHarvest, dth > 0 {
                                Label("\(dth) days to harvest", systemImage: "clock")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            if let spacing = plant.spacingInches, spacing > 0 {
                                Label("\(spacing)\" spacing", systemImage: "arrow.left.and.right")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    // Remove button
                    Button(role: .destructive) {
                        onDelete()
                    } label: {
                        Label("Remove Planting", systemImage: "trash")
                            .font(.caption.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                }
                .padding(.leading, 22)
                .padding(.bottom, 6)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10))
    }

    private var statusColor: Color {
        colorForStatus(planting.status ?? "planned")
    }

    private func colorForStatus(_ status: String) -> Color {
        switch status {
        case "planted": return .garden500
        case "germinated": return .garden400
        case "growing": return .garden600
        case "harvesting": return .orange
        case "planned": return .blue
        case "done": return .gray
        default: return .gray
        }
    }
}

// MARK: - Plant Picker Sheet

private struct PlantPickerSheet: View {
    let plants: [Plant]
    let onSelect: (Plant) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    private var filteredPlants: [Plant] {
        if searchText.isEmpty { return plants.sorted { $0.name < $1.name } }
        let query = searchText.lowercased()
        return plants.filter {
            $0.name.lowercased().contains(query) ||
            ($0.category?.lowercased().contains(query) ?? false) ||
            ($0.family?.lowercased().contains(query) ?? false)
        }.sorted { $0.name < $1.name }
    }

    private var groupedPlants: [(String, [Plant])] {
        let grouped = Dictionary(grouping: filteredPlants) { $0.category ?? "Other" }
        return grouped.sorted { $0.key < $1.key }
    }

    var body: some View {
        NavigationStack {
            List {
                if plants.isEmpty {
                    ContentUnavailableView(
                        "No Plants Available",
                        systemImage: "leaf.slash",
                        description: Text("Sync with the server to load the plant library.")
                    )
                } else {
                    ForEach(groupedPlants, id: \.0) { category, categoryPlants in
                        Section(category) {
                            ForEach(categoryPlants, id: \.id) { plant in
                                Button {
                                    onSelect(plant)
                                } label: {
                                    HStack(spacing: 12) {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(plant.name)
                                                .font(.subheadline.weight(.medium))
                                                .foregroundStyle(.primary)
                                            if let family = plant.family {
                                                Text(family)
                                                    .font(.caption)
                                                    .foregroundStyle(.secondary)
                                            }
                                        }

                                        Spacer()

                                        if let dth = plant.daysToHarvest, dth > 0 {
                                            Text("\(dth)d")
                                                .font(.caption.weight(.medium))
                                                .foregroundStyle(.secondary)
                                        }

                                        if let spacing = plant.spacingInches, spacing > 0 {
                                            Text("\(spacing)\"")
                                                .font(.caption)
                                                .foregroundStyle(.tertiary)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search plants...")
            .navigationTitle("Add Plant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Bed Log Button

private struct BedLogButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundStyle(color)
                Text(label)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Bed Quick Log Sheet

private struct BedQuickLogSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let elementServerId: Int?
    let bedLabel: String
    let initialType: String

    @State private var selectedType: String
    @State private var notes = ""

    private let logTypes = ["observation", "watering", "harvest", "maintenance", "planting", "pest"]

    init(elementServerId: Int?, bedLabel: String, initialType: String) {
        self.elementServerId = elementServerId
        self.bedLabel = bedLabel
        self.initialType = initialType
        _selectedType = State(initialValue: initialType)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Image(systemName: "square.grid.2x2")
                            .foregroundStyle(Color.garden600)
                        Text(bedLabel)
                            .font(.subheadline.weight(.medium))
                    }
                }

                Section("Type") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(logTypes, id: \.self) { type in
                                Button {
                                    selectedType = type
                                } label: {
                                    Text(type.capitalized)
                                        .font(.caption.weight(.medium))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(
                                            selectedType == type
                                                ? colorForType(type).opacity(0.2)
                                                : Color(.tertiarySystemFill),
                                            in: Capsule()
                                        )
                                        .foregroundStyle(
                                            selectedType == type ? colorForType(type) : .secondary
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                Section("Notes") {
                    TextField("What happened?", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Log Activity")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveLog()
                        dismiss()
                    }
                }
            }
        }
    }

    private func saveLog() {
        let today = ISO8601DateFormatter().string(from: Date()).components(separatedBy: "T").first ?? ""
        let entry = LogEntry(
            yardElementServerId: elementServerId,
            date: today,
            type: selectedType,
            content: notes.isEmpty ? nil : notes,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        modelContext.insert(entry)
    }

    private func colorForType(_ type: String) -> Color {
        switch type {
        case "planting": return .garden500
        case "harvest": return .orange
        case "observation": return .blue
        case "maintenance": return .purple
        case "watering": return .cyan
        case "pest": return .red
        default: return .gray
        }
    }
}

// MARK: - Property Row

private struct PropertyRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                Text(value)
                    .font(.caption.weight(.medium))
            }
            Spacer()
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
    }
}
