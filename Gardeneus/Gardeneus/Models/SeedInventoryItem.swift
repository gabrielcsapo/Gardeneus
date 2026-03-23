import Foundation
import SwiftData

@Model
final class SeedInventoryItem {
    var serverId: Int?
    var plantServerId: Int?
    var variety: String?
    var brand: String?
    var purchaseDate: String?
    var expirationDate: String?
    var quantityRemaining: Double?
    var quantityUnit: String?
    var lotNumber: String?
    var notes: String?
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        plantServerId: Int? = nil,
        variety: String? = nil,
        brand: String? = nil,
        purchaseDate: String? = nil,
        expirationDate: String? = nil,
        quantityRemaining: Double? = nil,
        quantityUnit: String? = nil,
        lotNumber: String? = nil,
        notes: String? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.plantServerId = plantServerId
        self.variety = variety
        self.brand = brand
        self.purchaseDate = purchaseDate
        self.expirationDate = expirationDate
        self.quantityRemaining = quantityRemaining
        self.quantityUnit = quantityUnit
        self.lotNumber = lotNumber
        self.notes = notes
        self.updatedAt = updatedAt
    }
}
