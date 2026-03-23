import Foundation
import SwiftData

@Model
final class Plant {
    var serverId: Int?
    var name: String
    var variety: String?
    var plantDescription: String?
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

    init(
        serverId: Int? = nil,
        name: String = "",
        variety: String? = nil,
        plantDescription: String? = nil,
        category: String? = nil,
        family: String? = nil,
        daysToHarvest: Int? = nil,
        spacingInches: Int? = nil,
        indoorStartWeeksBeforeFrost: Int? = nil,
        directSowWeeksBeforeFrost: Int? = nil,
        transplantWeeksAfterFrost: Int? = nil,
        waterNeeds: String? = nil,
        frostTolerance: String? = nil,
        expectedYieldPerPlant: Double? = nil,
        expectedYieldUnit: String? = nil,
        companions: [String]? = nil,
        incompatible: [String]? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.name = name
        self.variety = variety
        self.plantDescription = plantDescription
        self.category = category
        self.family = family
        self.daysToHarvest = daysToHarvest
        self.spacingInches = spacingInches
        self.indoorStartWeeksBeforeFrost = indoorStartWeeksBeforeFrost
        self.directSowWeeksBeforeFrost = directSowWeeksBeforeFrost
        self.transplantWeeksAfterFrost = transplantWeeksAfterFrost
        self.waterNeeds = waterNeeds
        self.frostTolerance = frostTolerance
        self.expectedYieldPerPlant = expectedYieldPerPlant
        self.expectedYieldUnit = expectedYieldUnit
        self.companions = companions
        self.incompatible = incompatible
        self.updatedAt = updatedAt
    }
}
