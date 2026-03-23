import Foundation
import SwiftData

@Model
final class Yard {
    var serverId: Int?
    var name: String
    var widthFt: Int
    var heightFt: Int
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        name: String = "",
        widthFt: Int = 20,
        heightFt: Int = 20,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.name = name
        self.widthFt = widthFt
        self.heightFt = heightFt
        self.updatedAt = updatedAt
    }
}
