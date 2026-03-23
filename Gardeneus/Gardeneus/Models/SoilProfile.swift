import Foundation
import SwiftData

@Model
final class SoilProfile {
    var serverId: Int?
    var yardElementServerId: Int?
    var testDate: String?
    var ph: Double?
    var nitrogenLevel: String?
    var phosphorusLevel: String?
    var potassiumLevel: String?
    var organicMatterPct: Double?
    var soilType: String?
    var notes: String?
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        yardElementServerId: Int? = nil,
        testDate: String? = nil,
        ph: Double? = nil,
        nitrogenLevel: String? = nil,
        phosphorusLevel: String? = nil,
        potassiumLevel: String? = nil,
        organicMatterPct: Double? = nil,
        soilType: String? = nil,
        notes: String? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.yardElementServerId = yardElementServerId
        self.testDate = testDate
        self.ph = ph
        self.nitrogenLevel = nitrogenLevel
        self.phosphorusLevel = phosphorusLevel
        self.potassiumLevel = potassiumLevel
        self.organicMatterPct = organicMatterPct
        self.soilType = soilType
        self.notes = notes
        self.updatedAt = updatedAt
    }
}
