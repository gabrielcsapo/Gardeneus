import Foundation
import SwiftData
import Observation

// MARK: - Sync Engine

@Observable
class SyncEngine {
    var lastSyncDate: String?
    var isSyncing: Bool = false
    var lastError: String?
    var pendingChangesCount: Int = 0

    private let apiClient: APIClient
    private let modelContext: ModelContext
    private var lastAutoSyncTime: Date?

    private static let lastSyncKey = "lastSyncDate"
    private static let autoSyncMinInterval: TimeInterval = 30

    init(apiClient: APIClient, modelContext: ModelContext) {
        self.apiClient = apiClient
        self.modelContext = modelContext
        self.lastSyncDate = UserDefaults.standard.string(forKey: Self.lastSyncKey)
        Task { @MainActor in
            self.updatePendingCount()
        }
    }

    /// Human-readable time since last sync
    var lastSyncRelative: String? {
        guard let lastSyncDate, !lastSyncDate.isEmpty else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: lastSyncDate) ?? ISO8601DateFormatter().date(from: lastSyncDate) else {
            return lastSyncDate
        }
        let seconds = Date().timeIntervalSince(date)
        if seconds < 60 { return "just now" }
        if seconds < 3600 { return "\(Int(seconds / 60)) min ago" }
        if seconds < 86400 { return "\(Int(seconds / 3600))h ago" }
        return "\(Int(seconds / 86400))d ago"
    }

    /// Auto-sync if enough time has passed since last auto-sync
    func autoSyncIfNeeded() async {
        if let lastAuto = lastAutoSyncTime, Date().timeIntervalSince(lastAuto) < Self.autoSyncMinInterval {
            return
        }
        lastAutoSyncTime = Date()
        do {
            try await incrementalSync()
        } catch {
            print("[AutoSync] Failed: \(error.localizedDescription)")
        }
    }

    @MainActor
    func updatePendingCount() {
        var count = 0
        if let elements = try? modelContext.fetch(FetchDescriptor<YardElement>()) {
            count += elements.filter { $0.serverId == nil && $0.yardServerId != nil }.count
        }
        if let plantings = try? modelContext.fetch(FetchDescriptor<Planting>()) {
            count += plantings.filter { $0.serverId == nil && $0.yardElementServerId != nil && $0.plantServerId != nil }.count
        }
        if let logs = try? modelContext.fetch(FetchDescriptor<LogEntry>()) {
            count += logs.filter { $0.serverId == nil }.count
        }
        pendingChangesCount = count
    }

    // MARK: - Full Sync (pull from server, replace local)

    func fullSync() async throws {
        guard !isSyncing else { return }

        await MainActor.run { [self] in
            isSyncing = true
            lastError = nil
        }

        defer {
            Task { @MainActor [self] in
                isSyncing = false
            }
        }

        do {
            // Push local changes first, then pull everything
            try await pushLocalChanges()

            let syncResponse = try await apiClient.fullSync()
            try await MainActor.run { [self] in
                try clearAllLocalData()
                try applyServerData(syncResponse)

                if let syncedAt = syncResponse.syncedAt {
                    lastSyncDate = syncedAt
                    UserDefaults.standard.set(syncedAt, forKey: Self.lastSyncKey)
                }

                try modelContext.save()
            }
        } catch {
            await MainActor.run { [self] in
                lastError = error.localizedDescription
            }
            throw error
        }
    }

    // MARK: - Incremental Sync

    func incrementalSync() async throws {
        guard !isSyncing else { return }

        guard let since = lastSyncDate else {
            try await fullSync()
            return
        }

        await MainActor.run { [self] in
            isSyncing = true
            lastError = nil
        }

        defer {
            Task { @MainActor [self] in
                isSyncing = false
            }
        }

        do {
            try await pushLocalChanges()

            let syncResponse = try await apiClient.incrementalSync(since: since)
            try await MainActor.run { [self] in
                try upsertServerData(syncResponse)

                if let syncedAt = syncResponse.syncedAt {
                    lastSyncDate = syncedAt
                    UserDefaults.standard.set(syncedAt, forKey: Self.lastSyncKey)
                }

                try modelContext.save()
            }
        } catch {
            await MainActor.run { [self] in
                lastError = error.localizedDescription
            }
            throw error
        }
    }

    // MARK: - Push Local Changes

    /// Collects locally-created entities (no serverId) and pushes them to the server.
    private func pushLocalChanges() async throws {
        // 1. Push local yard elements (for existing synced yards)
        let localElements = try await MainActor.run { [self] in
            let descriptor = FetchDescriptor<YardElement>()
            return try modelContext.fetch(descriptor).filter { $0.serverId == nil && $0.yardServerId != nil }
        }

        for element in localElements {
            guard let yardId = element.yardServerId else { continue }
            var data: [String: Any] = [
                "shapeType": element.shapeType,
                "x": element.x,
                "y": element.y,
                "width": element.width,
                "height": element.height,
                "rotation": element.rotation,
                "mulched": element.mulched ? 1 : 0,
            ]
            if let label = element.label { data["label"] = label }
            if let sun = element.sunExposure { data["sunExposure"] = sun }
            if let ext = element.seasonExtension { data["seasonExtension"] = ext }
            if let irr = element.irrigationType { data["irrigationType"] = irr }

            try await apiClient.createElement(yardId: yardId, data: data)
        }

        if !localElements.isEmpty {
            await MainActor.run { [self] in
                for element in localElements {
                    modelContext.delete(element)
                }
            }
        }

        // 2. Push local plantings (for existing synced elements)
        let localPlantings = try await MainActor.run { [self] in
            let descriptor = FetchDescriptor<Planting>()
            return try modelContext.fetch(descriptor).filter { $0.serverId == nil && $0.yardElementServerId != nil && $0.plantServerId != nil }
        }

        for planting in localPlantings {
            let dto = PlantingDTO(
                id: nil,
                plantId: planting.plantServerId,
                yardElementId: planting.yardElementServerId,
                plantedDate: planting.plantedDate,
                status: planting.status,
                expectedHarvestDate: planting.expectedHarvestDate,
                quantity: planting.quantity,
                notes: planting.notes,
                season: planting.season,
                updatedAt: planting.updatedAt
            )
            try await apiClient.createPlanting(dto)
        }

        if !localPlantings.isEmpty {
            await MainActor.run { [self] in
                for planting in localPlantings {
                    modelContext.delete(planting)
                }
            }
        }

        // 3. Push local log entries
        let localLogs = try await MainActor.run { [self] in
            let descriptor = FetchDescriptor<LogEntry>()
            return try modelContext.fetch(descriptor).filter { $0.serverId == nil }
        }

        for entry in localLogs {
            // Upload photo if present
            var serverPhotoPath: String?
            if let photoFileName = entry.photoFileName {
                let photosDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                    .appendingPathComponent("photos")
                    .appendingPathComponent(photoFileName)
                if let imageData = try? Data(contentsOf: photosDir) {
                    serverPhotoPath = try? await apiClient.uploadPhoto(imageData: imageData, fileName: photoFileName)
                }
            }

            let dto = LogEntryDTO(
                id: nil,
                date: entry.date,
                type: entry.type,
                content: entry.content,
                stage: entry.stage,
                yieldAmount: entry.yieldAmount,
                yieldUnit: entry.yieldUnit,
                photoPath: serverPhotoPath,
                plantingId: entry.plantingServerId,
                yardElementId: entry.yardElementServerId,
                plantName: nil,
                bedLabel: nil,
                updatedAt: entry.updatedAt
            )
            try await apiClient.createLogEntry(dto)
        }

        if !localLogs.isEmpty {
            await MainActor.run { [self] in
                for entry in localLogs {
                    modelContext.delete(entry)
                }
            }
        }
    }

    // MARK: - Clear Local Data

    private func clearAllLocalData() throws {
        try modelContext.delete(model: Settings.self)
        try modelContext.delete(model: Yard.self)
        try modelContext.delete(model: YardElement.self)
        try modelContext.delete(model: Plant.self)
        try modelContext.delete(model: Planting.self)
        try modelContext.delete(model: LogEntry.self)
        try modelContext.delete(model: SeedInventoryItem.self)
        try modelContext.delete(model: GardenTask.self)
        try modelContext.delete(model: SoilProfile.self)
    }

    // MARK: - Apply Server Data (Full Sync)

    private func applyServerData(_ syncResponse: SyncResponseDTO) throws {
        // Settings
        if let dto = syncResponse.settings {
            modelContext.insert(Settings(
                serverId: dto.id,
                zipCode: dto.zipCode,
                zone: dto.zone,
                lastFrostDate: dto.lastFrostDate,
                firstFrostDate: dto.firstFrostDate,
                latitude: dto.latitude,
                longitude: dto.longitude,
                updatedAt: dto.updatedAt
            ))
        }

        // Yards
        if let yards = syncResponse.yards {
            for dto in yards {
                modelContext.insert(Yard(
                    serverId: dto.id,
                    name: dto.name ?? "",
                    widthFt: dto.widthFt ?? 20,
                    heightFt: dto.heightFt ?? 20,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Yard Elements
        if let elements = syncResponse.yardElements {
            for dto in elements {
                modelContext.insert(YardElement(
                    serverId: dto.id,
                    yardServerId: dto.yardId,
                    shapeType: dto.shapeType ?? "rectangle",
                    x: dto.x ?? 0,
                    y: dto.y ?? 0,
                    width: dto.width ?? 4,
                    height: dto.height ?? 4,
                    label: dto.label,
                    sunExposure: dto.sunExposure,
                    rotation: dto.rotation ?? 0,
                    seasonExtension: dto.seasonExtension,
                    irrigationType: dto.irrigationType,
                    mulched: dto.isMulched,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Plants
        if let plants = syncResponse.plants {
            for dto in plants {
                modelContext.insert(Plant(
                    serverId: dto.id,
                    name: dto.name ?? "",
                    variety: dto.variety,
                    plantDescription: dto.description,
                    category: dto.category,
                    family: dto.family,
                    daysToHarvest: dto.daysToHarvest,
                    spacingInches: dto.spacingInches,
                    waterNeeds: dto.waterNeeds,
                    frostTolerance: dto.frostTolerance,
                    expectedYieldPerPlant: dto.expectedYieldPerPlant,
                    expectedYieldUnit: dto.expectedYieldUnit,
                    companions: dto.companions,
                    incompatible: dto.incompatible,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Plantings
        if let plantings = syncResponse.plantings {
            for dto in plantings {
                modelContext.insert(Planting(
                    serverId: dto.id,
                    plantServerId: dto.plantId,
                    yardElementServerId: dto.yardElementId,
                    plantedDate: dto.plantedDate,
                    status: dto.status,
                    expectedHarvestDate: dto.expectedHarvestDate,
                    quantity: dto.quantity ?? 1,
                    notes: dto.notes,
                    season: dto.season,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Log Entries
        if let logs = syncResponse.logEntries {
            for dto in logs {
                modelContext.insert(LogEntry(
                    serverId: dto.id,
                    plantingServerId: dto.plantingId,
                    yardElementServerId: dto.yardElementId,
                    date: dto.date ?? "",
                    type: dto.type ?? "observation",
                    content: dto.content,
                    stage: dto.stage,
                    yieldAmount: dto.yieldAmount,
                    yieldUnit: dto.yieldUnit,
                    photoFileName: dto.photoPath,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Seed Inventory
        if let seeds = syncResponse.seedInventory {
            for dto in seeds {
                modelContext.insert(SeedInventoryItem(
                    serverId: dto.id,
                    plantServerId: dto.plantId,
                    variety: dto.variety,
                    brand: dto.brand,
                    purchaseDate: dto.purchaseDate,
                    expirationDate: dto.expirationDate,
                    quantityRemaining: dto.quantityRemaining,
                    quantityUnit: dto.quantityUnit,
                    lotNumber: dto.lotNumber,
                    notes: dto.notes,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Tasks
        if let tasks = syncResponse.tasks {
            for dto in tasks {
                modelContext.insert(GardenTask(
                    serverId: dto.id,
                    title: dto.title ?? "",
                    taskDescription: dto.description,
                    dueDate: dto.dueDate,
                    recurrence: dto.recurrence,
                    completedAt: dto.completedAt,
                    plantingServerId: dto.plantingId,
                    yardElementServerId: dto.yardElementId,
                    taskType: dto.taskType,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Soil Profiles
        if let profiles = syncResponse.soilProfiles {
            for dto in profiles {
                modelContext.insert(SoilProfile(
                    serverId: dto.id,
                    yardElementServerId: dto.yardElementId,
                    testDate: dto.testDate,
                    ph: dto.ph,
                    nitrogenLevel: dto.nitrogenLevel,
                    phosphorusLevel: dto.phosphorusLevel,
                    potassiumLevel: dto.potassiumLevel,
                    organicMatterPct: dto.organicMatterPct,
                    soilType: dto.soilType,
                    notes: dto.notes,
                    updatedAt: dto.updatedAt
                ))
            }
        }
    }

    // MARK: - Upsert Server Data (Incremental Sync)

    private func upsertServerData(_ syncResponse: SyncResponseDTO) throws {
        // Settings
        if let dto = syncResponse.settings {
            let descriptor = FetchDescriptor<Settings>()
            let existing = try modelContext.fetch(descriptor).first
            if let existing {
                existing.serverId = dto.id
                existing.zipCode = dto.zipCode
                existing.zone = dto.zone
                existing.lastFrostDate = dto.lastFrostDate
                existing.firstFrostDate = dto.firstFrostDate
                existing.latitude = dto.latitude
                existing.longitude = dto.longitude
                existing.updatedAt = dto.updatedAt
            } else {
                modelContext.insert(Settings(
                    serverId: dto.id,
                    zipCode: dto.zipCode,
                    zone: dto.zone,
                    lastFrostDate: dto.lastFrostDate,
                    firstFrostDate: dto.firstFrostDate,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    updatedAt: dto.updatedAt
                ))
            }
        }

        // Yards
        if let yards = syncResponse.yards {
            for dto in yards {
                guard let serverId = dto.id else { continue }
                if let existing = try fetchByServerId(Yard.self, serverId: serverId) {
                    existing.name = dto.name ?? existing.name
                    existing.widthFt = dto.widthFt ?? existing.widthFt
                    existing.heightFt = dto.heightFt ?? existing.heightFt
                    existing.updatedAt = dto.updatedAt
                } else {
                    modelContext.insert(Yard(
                        serverId: serverId,
                        name: dto.name ?? "",
                        widthFt: dto.widthFt ?? 20,
                        heightFt: dto.heightFt ?? 20,
                        updatedAt: dto.updatedAt
                    ))
                }
            }
        }

        // Yard Elements
        if let elements = syncResponse.yardElements {
            for dto in elements {
                guard let serverId = dto.id else { continue }
                if let existing = try fetchByServerId(YardElement.self, serverId: serverId) {
                    existing.yardServerId = dto.yardId ?? existing.yardServerId
                    existing.shapeType = dto.shapeType ?? existing.shapeType
                    existing.x = dto.x ?? existing.x
                    existing.y = dto.y ?? existing.y
                    existing.width = dto.width ?? existing.width
                    existing.height = dto.height ?? existing.height
                    existing.label = dto.label
                    existing.sunExposure = dto.sunExposure
                    existing.rotation = dto.rotation ?? existing.rotation
                    existing.seasonExtension = dto.seasonExtension
                    existing.irrigationType = dto.irrigationType
                    existing.mulched = dto.isMulched
                    existing.updatedAt = dto.updatedAt
                } else {
                    modelContext.insert(YardElement(
                        serverId: serverId,
                        yardServerId: dto.yardId,
                        shapeType: dto.shapeType ?? "rectangle",
                        x: dto.x ?? 0,
                        y: dto.y ?? 0,
                        width: dto.width ?? 4,
                        height: dto.height ?? 4,
                        label: dto.label,
                        sunExposure: dto.sunExposure,
                        rotation: dto.rotation ?? 0,
                        seasonExtension: dto.seasonExtension,
                        irrigationType: dto.irrigationType,
                        mulched: dto.isMulched,
                        updatedAt: dto.updatedAt
                    ))
                }
            }
        }

        // Plantings
        if let plantings = syncResponse.plantings {
            for dto in plantings {
                guard let serverId = dto.id else { continue }
                if let existing = try fetchByServerId(Planting.self, serverId: serverId) {
                    existing.plantServerId = dto.plantId ?? existing.plantServerId
                    existing.yardElementServerId = dto.yardElementId ?? existing.yardElementServerId
                    existing.plantedDate = dto.plantedDate
                    existing.status = dto.status ?? existing.status
                    existing.expectedHarvestDate = dto.expectedHarvestDate
                    existing.quantity = dto.quantity ?? existing.quantity
                    existing.notes = dto.notes
                    existing.season = dto.season
                    existing.updatedAt = dto.updatedAt
                } else {
                    modelContext.insert(Planting(
                        serverId: serverId,
                        plantServerId: dto.plantId,
                        yardElementServerId: dto.yardElementId,
                        plantedDate: dto.plantedDate,
                        status: dto.status,
                        expectedHarvestDate: dto.expectedHarvestDate,
                        quantity: dto.quantity ?? 1,
                        notes: dto.notes,
                        season: dto.season,
                        updatedAt: dto.updatedAt
                    ))
                }
            }
        }
    }

    // MARK: - Fetch Helper

    private func fetchByServerId<T: PersistentModel>(_ type: T.Type, serverId: Int) throws -> T? {
        let descriptor = FetchDescriptor<T>(
            predicate: #Predicate<T> { _ in true }
        )
        let results = try modelContext.fetch(descriptor)

        return results.first { model in
            if let settings = model as? Settings { return settings.serverId == serverId }
            if let yard = model as? Yard { return yard.serverId == serverId }
            if let element = model as? YardElement { return element.serverId == serverId }
            if let plant = model as? Plant { return plant.serverId == serverId }
            if let planting = model as? Planting { return planting.serverId == serverId }
            return false
        }
    }
}
