import Foundation

// MARK: - Settings

struct SettingsDTO: Codable, Sendable {
    let id: Int?
    var zipCode: String?
    var zone: String?
    var lastFrostDate: String?
    var firstFrostDate: String?
    var latitude: Double?
    var longitude: Double?
    var updatedAt: String?
}

// MARK: - Yard

struct YardDTO: Codable, Sendable {
    let id: Int?
    var name: String?
    var widthFt: Int?
    var heightFt: Int?
    var updatedAt: String?
    var elements: [YardElementDTO]?
}

// MARK: - Yard Element

struct YardElementDTO: Codable, Sendable {
    let id: Int?
    var yardId: Int?
    var shapeType: String?
    var x: Int?
    var y: Int?
    var width: Int?
    var height: Int?
    var label: String?
    var sunExposure: String?
    var rotation: Int?
    var seasonExtension: String?
    var irrigationType: String?
    var mulched: Int?
    var updatedAt: String?

    var isMulched: Bool { (mulched ?? 0) != 0 }
}

// MARK: - Plant

struct PlantDTO: Codable, Sendable {
    let id: Int?
    var name: String?
    var variety: String?
    var description: String?
    var category: String?
    var family: String?
    var daysToHarvest: Int?
    var spacingInches: Int?
    var indoorStartWeeksBeforeFrost: Int?
    var directSowWeeksBeforeFrost: Int?
    var transplantWeeksAfterFrost: Int?
    var waterNeeds: String?
    var frostTolerance: String?
    var expectedYieldPerPlant: Double?
    var expectedYieldUnit: String?
    var companions: [String]?
    var incompatible: [String]?
    var updatedAt: String?
}

// MARK: - Planting

struct PlantingDTO: Codable, Sendable {
    let id: Int?
    var plantId: Int?
    var yardElementId: Int?
    var plantedDate: String?
    var status: String?
    var expectedHarvestDate: String?
    var quantity: Int?
    var notes: String?
    var season: String?
    var updatedAt: String?
}

// MARK: - Log Entry

struct LogEntryDTO: Codable, Sendable {
    let id: Int?
    var date: String?
    var type: String?
    var content: String?
    var stage: String?
    var yieldAmount: Double?
    var yieldUnit: String?
    var photoPath: String?
    var plantingId: Int?
    var yardElementId: Int?
    var plantName: String?
    var bedLabel: String?
    var updatedAt: String?
}

// MARK: - Seed Inventory

struct SeedInventoryDTO: Codable, Sendable {
    let id: Int?
    var plantId: Int?
    var plantName: String?
    var variety: String?
    var brand: String?
    var purchaseDate: String?
    var expirationDate: String?
    var quantityRemaining: Double?
    var quantityUnit: String?
    var lotNumber: String?
    var notes: String?
    var updatedAt: String?
}

// MARK: - Garden Task

struct GardenTaskDTO: Codable, Sendable {
    let id: Int?
    var title: String?
    var description: String?
    var dueDate: String?
    var recurrence: String?
    var completedAt: String?
    var plantingId: Int?
    var yardElementId: Int?
    var taskType: String?
    var bedLabel: String?
    var updatedAt: String?
}

// MARK: - Pest / Disease

struct PestDiseaseDTO: Codable, Sendable {
    let id: Int?
    var name: String?
    var type: String?
    var description: String?
    var symptoms: String?
    var organicTreatments: [String]?
    var preventionTips: [String]?
    var affectedPlants: [String]?
    var beneficialPredators: [String]?
    var activeMonths: [Int]?
}

// MARK: - Soil Profile

struct SoilProfileDTO: Codable, Sendable {
    let id: Int?
    var yardElementId: Int?
    var bedLabel: String?
    var testDate: String?
    var ph: Double?
    var nitrogenLevel: String?
    var phosphorusLevel: String?
    var potassiumLevel: String?
    var organicMatterPct: Double?
    var soilType: String?
    var notes: String?
    var updatedAt: String?
}

// MARK: - Sync Response

struct SyncResponseDTO: Codable, Sendable {
    let syncedAt: String?
    var settings: SettingsDTO?
    var yards: [YardDTO]?
    var yardElements: [YardElementDTO]?
    var plants: [PlantDTO]?
    var plantings: [PlantingDTO]?
    var logEntries: [LogEntryDTO]?
    var seedInventory: [SeedInventoryDTO]?
    var tasks: [GardenTaskDTO]?
    var soilProfiles: [SoilProfileDTO]?
}

// MARK: - Push Sync Response

struct PushSyncResponseDTO: Codable, Sendable {
    let applied: Int
    let syncedAt: String
}
