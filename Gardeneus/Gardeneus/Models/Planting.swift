import Foundation
import SwiftData

@Model
final class Planting {
    var serverId: Int?
    var plantServerId: Int?
    var yardElementServerId: Int?
    var plantedDate: String?
    var status: String?
    var expectedHarvestDate: String?
    var quantity: Int
    var notes: String?
    var season: String?
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        plantServerId: Int? = nil,
        yardElementServerId: Int? = nil,
        plantedDate: String? = nil,
        status: String? = "planned",
        expectedHarvestDate: String? = nil,
        quantity: Int = 1,
        notes: String? = nil,
        season: String? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.plantServerId = plantServerId
        self.yardElementServerId = yardElementServerId
        self.plantedDate = plantedDate
        self.status = status
        self.expectedHarvestDate = expectedHarvestDate
        self.quantity = quantity
        self.notes = notes
        self.season = season
        self.updatedAt = updatedAt
    }
}
