import Foundation
import SwiftData

@Model
final class LogEntry {
    var serverId: Int?
    var plantingServerId: Int?
    var yardElementServerId: Int?
    var date: String
    var type: String
    var content: String?
    var stage: String?
    var yieldAmount: Double?
    var yieldUnit: String?
    var photoFileName: String?
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        plantingServerId: Int? = nil,
        yardElementServerId: Int? = nil,
        date: String = "",
        type: String = "observation",
        content: String? = nil,
        stage: String? = nil,
        yieldAmount: Double? = nil,
        yieldUnit: String? = nil,
        photoFileName: String? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.plantingServerId = plantingServerId
        self.yardElementServerId = yardElementServerId
        self.date = date
        self.type = type
        self.content = content
        self.stage = stage
        self.yieldAmount = yieldAmount
        self.yieldUnit = yieldUnit
        self.photoFileName = photoFileName
        self.updatedAt = updatedAt
    }
}
