import Foundation
import SwiftData

@Model
final class Settings {
    var serverId: Int?
    var zipCode: String?
    var zone: String?
    var lastFrostDate: String?
    var firstFrostDate: String?
    var latitude: Double?
    var longitude: Double?
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        zipCode: String? = nil,
        zone: String? = nil,
        lastFrostDate: String? = nil,
        firstFrostDate: String? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.zipCode = zipCode
        self.zone = zone
        self.lastFrostDate = lastFrostDate
        self.firstFrostDate = firstFrostDate
        self.latitude = latitude
        self.longitude = longitude
        self.updatedAt = updatedAt
    }
}
