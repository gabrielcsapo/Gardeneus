import SwiftUI
import SwiftData
import PhotosUI

struct QuickLogView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(ServerDiscovery.self) private var serverDiscovery

    @Query(sort: \LogEntry.date, order: .reverse) private var logEntries: [LogEntry]
    @Query private var yards: [Yard]
    @Query private var elements: [YardElement]
    @Query private var plantings: [Planting]
    @Query private var plants: [Plant]

    @State private var showingAddLog = false
    @State private var preSelectedType: String = "observation"
    @State private var preSelectedPhoto: UIImage?

    // Camera sheet -> then add log
    @State private var showingCamera = false
    @State private var capturedImage: UIImage?
    @State private var selectedLogEntry: LogEntry?

    // Filters
    @State private var filterType: String?
    @State private var searchText = ""

    private let logTypes = ["planting", "harvest", "observation", "maintenance", "watering", "pest", "weather"]

    private var filteredEntries: [LogEntry] {
        logEntries.filter { entry in
            let matchesType = filterType == nil || entry.type == filterType
            let matchesSearch = searchText.isEmpty ||
                (entry.content?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                entry.type.localizedCaseInsensitiveContains(searchText)
            return matchesType && matchesSearch
        }
    }

    private var groupedEntries: [(String, [LogEntry])] {
        let groups = Dictionary(grouping: filteredEntries) { $0.date }
        return groups.sorted { $0.key > $1.key }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    quickLogButtons

                    // Filter pills
                    filterPills

                    Divider()
                        .padding(.horizontal)

                    if filteredEntries.isEmpty {
                        emptyState
                    } else {
                        logTimeline
                    }
                }
                .padding()
            }
            .searchable(text: $searchText, prompt: "Search logs...")
            .navigationTitle("Garden Log")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingCamera = true
                    } label: {
                        Image(systemName: "camera")
                    }
                }
            }
            .sheet(isPresented: $showingAddLog) {
                AddLogSheet(
                    yards: Array(yards),
                    elements: Array(elements),
                    plantings: Array(plantings),
                    plants: Array(plants),
                    initialType: preSelectedType,
                    initialPhoto: preSelectedPhoto
                )
            }
            .sheet(isPresented: $showingCamera, onDismiss: {
                if let image = capturedImage {
                    preSelectedType = "observation"
                    preSelectedPhoto = image
                    capturedImage = nil
                    showingAddLog = true
                }
            }) {
                CameraCapture(capturedImage: $capturedImage)
            }
            .sheet(isPresented: Binding(
                get: { selectedLogEntry != nil },
                set: { if !$0 { selectedLogEntry = nil } }
            )) {
                if let entry = selectedLogEntry {
                    EditableLogDetailSheet(entry: entry, elements: Array(elements), onDelete: {
                        modelContext.delete(entry)
                        selectedLogEntry = nil
                    })
                }
            }
        }
    }

    // MARK: - Quick Log Buttons

    private var quickLogButtons: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            QuickLogButton(icon: "leaf.fill", label: "Planting", color: .garden500) {
                openAddLog(type: "planting")
            }
            QuickLogButton(icon: "basket.fill", label: "Harvest", color: .orange) {
                openAddLog(type: "harvest")
            }
            QuickLogButton(icon: "eye.fill", label: "Observe", color: .blue) {
                openAddLog(type: "observation")
            }
            QuickLogButton(icon: "wrench.fill", label: "Maintain", color: .purple) {
                openAddLog(type: "maintenance")
            }
            QuickLogButton(icon: "drop.fill", label: "Water", color: .cyan) {
                openAddLog(type: "watering")
            }
            QuickLogButton(icon: "plus.circle.fill", label: "Custom", color: .gray) {
                openAddLog(type: "observation")
            }
        }
    }

    // MARK: - Filter Pills

    private var filterPills: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterPill(label: "All", isSelected: filterType == nil) {
                    filterType = nil
                }
                ForEach(logTypes, id: \.self) { type in
                    FilterPill(
                        label: type.capitalized,
                        icon: iconForType(type),
                        color: colorForLogType(type),
                        isSelected: filterType == type
                    ) {
                        filterType = filterType == type ? nil : type
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func openAddLog(type: String) {
        preSelectedType = type
        preSelectedPhoto = nil
        showingAddLog = true
    }

    // MARK: - Log Timeline

    private var logTimeline: some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(groupedEntries, id: \.0) { date, entries in
                VStack(alignment: .leading, spacing: 4) {
                    Text(formatDate(date))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .padding(.horizontal, 4)
                        .padding(.bottom, 2)

                    ForEach(entries) { entry in
                        Button {
                            selectedLogEntry = entry
                        } label: {
                            logEntryRow(entry)
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button(role: .destructive) {
                                modelContext.delete(entry)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                modelContext.delete(entry)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
    }

    private func logEntryRow(_ entry: LogEntry) -> some View {
        HStack(alignment: .top, spacing: 12) {
            // Timeline dot
            VStack(spacing: 0) {
                Circle()
                    .fill(colorForLogType(entry.type))
                    .frame(width: 10, height: 10)
            }
            .padding(.top, 4)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(entry.type.capitalized)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.primary)

                    // Bed label
                    if let bedId = entry.yardElementServerId,
                       let el = elements.first(where: { $0.serverId == bedId }) {
                        Text(el.label ?? "Bed #\(bedId)")
                            .font(.caption)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.garden100, in: Capsule())
                            .foregroundStyle(Color.garden700)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }

                if let content = entry.content, !content.isEmpty {
                    Text(content)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                // Photo thumbnail
                if let photoFile = entry.photoFileName,
                   let image = loadPhoto(named: photoFile) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 80, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }

                if let yield_ = entry.yieldAmount, yield_ > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "basket.fill")
                            .font(.caption2)
                        Text("\(yield_, specifier: "%.1f") \(entry.yieldUnit ?? "lbs")")
                            .font(.caption)
                    }
                    .foregroundStyle(.orange)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "note.text.badge.plus")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text(filterType != nil || !searchText.isEmpty ? "No Matching Entries" : "No Log Entries")
                .font(.title3.weight(.semibold))
            Text(filterType != nil || !searchText.isEmpty
                ? "Try changing your filters or search."
                : "Tap a button above to start logging your garden activity.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Helpers

    private func formatDate(_ dateStr: String) -> String {
        let today = ISO8601DateFormatter().string(from: Date()).components(separatedBy: "T").first ?? ""
        let yesterday: String = {
            let cal = Calendar.current
            let y = cal.date(byAdding: .day, value: -1, to: Date())!
            return ISO8601DateFormatter().string(from: y).components(separatedBy: "T").first ?? ""
        }()

        if dateStr == today { return "Today" }
        if dateStr == yesterday { return "Yesterday" }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: dateStr) {
            formatter.dateFormat = "EEEE, MMM d"
            return formatter.string(from: date)
        }
        return dateStr
    }

    private func iconForType(_ type: String) -> String {
        switch type {
        case "planting": return "leaf.fill"
        case "harvest": return "basket.fill"
        case "observation": return "eye.fill"
        case "maintenance": return "wrench.fill"
        case "watering": return "drop.fill"
        case "pest": return "ladybug.fill"
        case "weather": return "cloud.sun.fill"
        default: return "circle"
        }
    }

    private func colorForLogType(_ type: String?) -> Color {
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

    private func loadPhoto(named fileName: String) -> UIImage? {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("photos")
            .appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return UIImage(data: data)
    }
}

// MARK: - Filter Pill

private struct FilterPill: View {
    let label: String
    var icon: String?
    var color: Color?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon {
                    Image(systemName: icon)
                        .font(.caption2)
                }
                Text(label)
                    .font(.caption.weight(.medium))
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                isSelected ? (color ?? Color.gardenPrimary) : Color.earth100,
                in: Capsule()
            )
            .foregroundStyle(isSelected ? .white : .primary)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Quick Log Button

private struct QuickLogButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                Text(label)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Add Log Sheet

private struct AddLogSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let yards: [Yard]
    let elements: [YardElement]
    let plantings: [Planting]
    let plants: [Plant]
    let initialType: String
    let initialPhoto: UIImage?

    @State private var selectedType: String
    @State private var content = ""
    @State private var selectedBedId: Int?
    @State private var yieldAmount = ""
    @State private var yieldUnit = "lbs"

    // Photo
    @State private var photo: UIImage?
    @State private var showCamera = false
    @State private var showPhotoPicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?

    private let logTypes = ["planting", "harvest", "observation", "maintenance", "watering", "pest", "weather"]
    private let yieldUnits = ["lbs", "oz", "kg", "count", "bunches"]

    init(yards: [Yard], elements: [YardElement], plantings: [Planting], plants: [Plant], initialType: String, initialPhoto: UIImage?) {
        self.yards = yards
        self.elements = elements
        self.plantings = plantings
        self.plants = plants
        self.initialType = initialType
        self.initialPhoto = initialPhoto
        _selectedType = State(initialValue: initialType)
        _photo = State(initialValue: initialPhoto)
    }

    /// Elements grouped by yard for the picker
    private var yardGroups: [(Yard, [YardElement])] {
        yards.compactMap { yard in
            guard let yardId = yard.serverId else { return nil }
            let yardElements = elements.filter { $0.yardServerId == yardId }
            return yardElements.isEmpty ? nil : (yard, yardElements)
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Type") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(logTypes, id: \.self) { type in
                                Button {
                                    selectedType = type
                                } label: {
                                    HStack(spacing: 4) {
                                        Image(systemName: iconForType(type))
                                            .font(.caption)
                                        Text(type.capitalized)
                                            .font(.caption.weight(.medium))
                                    }
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(
                                        selectedType == type
                                            ? colorForType(type).opacity(0.2)
                                            : Color(.tertiarySystemFill),
                                        in: Capsule()
                                    )
                                    .foregroundStyle(
                                        selectedType == type
                                            ? colorForType(type)
                                            : .secondary
                                    )
                                    .overlay(
                                        Capsule()
                                            .stroke(selectedType == type ? colorForType(type) : .clear, lineWidth: 1)
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                Section("Bed") {
                    if yardGroups.isEmpty {
                        Text("No beds available. Sync with server to load yards.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        Picker("Select Bed", selection: $selectedBedId) {
                            Text("None").tag(nil as Int?)
                            ForEach(yardGroups, id: \.0.id) { yard, yardElements in
                                Section(yard.name) {
                                    ForEach(yardElements, id: \.id) { el in
                                        HStack {
                                            if let spec = shapeConfig[el.shapeType] {
                                                Image(systemName: spec.icon)
                                                    .foregroundStyle(spec.borderColor)
                                            }
                                            Text(el.label ?? "Bed #\(el.serverId ?? 0)")
                                        }
                                        .tag(el.serverId as Int?)
                                    }
                                }
                            }
                        }
                    }
                }

                Section("Notes") {
                    TextField("What happened?", text: $content, axis: .vertical)
                        .lineLimit(3...6)
                }

                // Photo section
                Section("Photo") {
                    if let image = photo {
                        VStack(spacing: 8) {
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFit()
                                .frame(maxHeight: 200)
                                .clipShape(RoundedRectangle(cornerRadius: 8))

                            Button("Remove Photo", role: .destructive) {
                                photo = nil
                            }
                            .font(.caption)
                        }
                    } else {
                        HStack(spacing: 12) {
                            Button {
                                showCamera = true
                            } label: {
                                Label("Camera", systemImage: "camera.fill")
                                    .font(.subheadline)
                            }
                            .buttonStyle(.bordered)
                            .tint(Color.garden600)

                            PhotosPicker(
                                selection: $selectedPhotoItem,
                                matching: .images
                            ) {
                                Label("Library", systemImage: "photo.on.rectangle")
                                    .font(.subheadline)
                            }
                            .buttonStyle(.bordered)
                            .tint(.blue)
                        }
                    }
                }

                if selectedType == "harvest" {
                    Section("Yield") {
                        HStack {
                            TextField("Amount", text: $yieldAmount)
                                .keyboardType(.decimalPad)
                            Picker("Unit", selection: $yieldUnit) {
                                ForEach(yieldUnits, id: \.self) { u in
                                    Text(u).tag(u)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Add Log Entry")
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
            .fullScreenCover(isPresented: $showCamera) {
                CameraViewWrapper(image: $photo)
                    .ignoresSafeArea()
            }
            .onChange(of: selectedPhotoItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self) {
                        photo = UIImage(data: data)
                    }
                }
            }
        }
    }

    private func saveLog() {
        let today = ISO8601DateFormatter().string(from: Date()).components(separatedBy: "T").first ?? ""

        // Save photo if present
        var photoFile: String?
        if let image = photo, let data = image.jpegData(compressionQuality: 0.8) {
            let fileName = "log-\(UUID().uuidString).jpg"
            let photosDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("photos")
            try? FileManager.default.createDirectory(at: photosDir, withIntermediateDirectories: true)
            let fileURL = photosDir.appendingPathComponent(fileName)
            try? data.write(to: fileURL)
            photoFile = fileName
        }

        let entry = LogEntry(
            date: today,
            type: selectedType,
            content: content.isEmpty ? nil : content,
            yieldAmount: Double(yieldAmount),
            yieldUnit: selectedType == "harvest" ? yieldUnit : nil,
            photoFileName: photoFile,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        if let bedId = selectedBedId {
            entry.yardElementServerId = bedId
        }
        modelContext.insert(entry)
    }

    private func iconForType(_ type: String) -> String {
        switch type {
        case "planting": return "leaf.fill"
        case "harvest": return "basket.fill"
        case "observation": return "eye.fill"
        case "maintenance": return "wrench.fill"
        case "watering": return "drop.fill"
        case "pest": return "ladybug.fill"
        case "weather": return "cloud.sun.fill"
        default: return "circle"
        }
    }

    private func colorForType(_ type: String) -> Color {
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
}

// MARK: - Editable Log Detail Sheet

private struct EditableLogDetailSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    let entry: LogEntry
    let elements: [YardElement]
    let onDelete: () -> Void

    @State private var editedContent: String
    @State private var editedType: String
    @State private var editedYieldAmount: String
    @State private var editedYieldUnit: String
    @State private var hasChanges = false

    private let logTypes = ["planting", "harvest", "observation", "maintenance", "watering", "pest", "weather"]
    private let yieldUnits = ["lbs", "oz", "kg", "count", "bunches"]

    init(entry: LogEntry, elements: [YardElement], onDelete: @escaping () -> Void) {
        self.entry = entry
        self.elements = elements
        self.onDelete = onDelete
        _editedContent = State(initialValue: entry.content ?? "")
        _editedType = State(initialValue: entry.type)
        _editedYieldAmount = State(initialValue: entry.yieldAmount != nil ? String(format: "%.1f", entry.yieldAmount!) : "")
        _editedYieldUnit = State(initialValue: entry.yieldUnit ?? "lbs")
    }

    private var bedElement: YardElement? {
        guard let bedId = entry.yardElementServerId else { return nil }
        return elements.first(where: { $0.serverId == bedId })
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Type selector
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Type")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(logTypes, id: \.self) { type in
                                    Button {
                                        editedType = type
                                        hasChanges = true
                                    } label: {
                                        HStack(spacing: 4) {
                                            Image(systemName: iconForType(type))
                                                .font(.caption)
                                            Text(type.capitalized)
                                                .font(.caption.weight(.medium))
                                        }
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(
                                            editedType == type
                                                ? colorForType(type).opacity(0.2)
                                                : Color(.tertiarySystemFill),
                                            in: Capsule()
                                        )
                                        .foregroundStyle(
                                            editedType == type
                                                ? colorForType(type)
                                                : .secondary
                                        )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    // Date
                    HStack(spacing: 8) {
                        Image(systemName: "calendar")
                            .foregroundStyle(.secondary)
                            .frame(width: 20)
                        Text(entry.date)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    // Bed info
                    if let bed = bedElement {
                        HStack(spacing: 8) {
                            if let spec = shapeConfig[bed.shapeType] {
                                Image(systemName: spec.icon)
                                    .foregroundStyle(spec.borderColor)
                            }
                            Text(bed.label ?? "Bed #\(bed.serverId ?? 0)")
                                .font(.subheadline.weight(.medium))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.garden100, in: RoundedRectangle(cornerRadius: 8))
                        .foregroundStyle(Color.garden700)
                    }

                    // Notes (editable)
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Notes")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)

                        TextField("What happened?", text: $editedContent, axis: .vertical)
                            .lineLimit(3...8)
                            .textFieldStyle(.roundedBorder)
                            .onChange(of: editedContent) { _, _ in hasChanges = true }
                    }

                    // Photo
                    if let photoFile = entry.photoFileName,
                       let image = loadPhoto(named: photoFile) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Photo")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFit()
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }

                    // Yield (editable for harvest)
                    if editedType == "harvest" {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Harvest Yield")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)

                            HStack {
                                TextField("Amount", text: $editedYieldAmount)
                                    .keyboardType(.decimalPad)
                                    .textFieldStyle(.roundedBorder)
                                    .onChange(of: editedYieldAmount) { _, _ in hasChanges = true }

                                Picker("Unit", selection: $editedYieldUnit) {
                                    ForEach(yieldUnits, id: \.self) { u in
                                        Text(u).tag(u)
                                    }
                                }
                                .onChange(of: editedYieldUnit) { _, _ in hasChanges = true }
                            }
                        }
                    }

                    Spacer(minLength: 20)

                    // Delete button
                    Button(role: .destructive) {
                        onDelete()
                        dismiss()
                    } label: {
                        HStack {
                            Spacer()
                            Label("Delete Entry", systemImage: "trash")
                                .font(.subheadline.weight(.medium))
                            Spacer()
                        }
                        .padding(.vertical, 12)
                        .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                    }
                }
                .padding()
            }
            .navigationTitle("Log Entry")
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
        entry.type = editedType
        entry.content = editedContent.isEmpty ? nil : editedContent
        if editedType == "harvest" {
            entry.yieldAmount = Double(editedYieldAmount)
            entry.yieldUnit = editedYieldUnit
        } else {
            entry.yieldAmount = nil
            entry.yieldUnit = nil
        }
        entry.updatedAt = ISO8601DateFormatter().string(from: Date())
    }

    private func loadPhoto(named fileName: String) -> UIImage? {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("photos")
            .appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return UIImage(data: data)
    }

    private func iconForType(_ type: String) -> String {
        switch type {
        case "planting": return "leaf.fill"
        case "harvest": return "basket.fill"
        case "observation": return "eye.fill"
        case "maintenance": return "wrench.fill"
        case "watering": return "drop.fill"
        case "pest": return "ladybug.fill"
        case "weather": return "cloud.sun.fill"
        default: return "circle"
        }
    }

    private func colorForType(_ type: String) -> Color {
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
}
