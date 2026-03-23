import Foundation
import SwiftData

@Model
final class YardElement {
    var serverId: Int?
    var yardServerId: Int?
    var shapeType: String
    var x: Int
    var y: Int
    var width: Int
    var height: Int
    var label: String?
    var sunExposure: String?
    var rotation: Int
    var seasonExtension: String?
    var irrigationType: String?
    var mulched: Bool
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        yardServerId: Int? = nil,
        shapeType: String = "rectangle",
        x: Int = 0,
        y: Int = 0,
        width: Int = 4,
        height: Int = 4,
        label: String? = nil,
        sunExposure: String? = nil,
        rotation: Int = 0,
        seasonExtension: String? = nil,
        irrigationType: String? = nil,
        mulched: Bool = false,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.yardServerId = yardServerId
        self.shapeType = shapeType
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.label = label
        self.sunExposure = sunExposure
        self.rotation = rotation
        self.seasonExtension = seasonExtension
        self.irrigationType = irrigationType
        self.mulched = mulched
        self.updatedAt = updatedAt
    }
}
