import Foundation
import SwiftData

@Model
final class GardenTask {
    var serverId: Int?
    var title: String
    var taskDescription: String?
    var dueDate: String?
    var recurrence: String?
    var completedAt: String?
    var plantingServerId: Int?
    var yardElementServerId: Int?
    var taskType: String?
    var updatedAt: String?

    init(
        serverId: Int? = nil,
        title: String = "",
        taskDescription: String? = nil,
        dueDate: String? = nil,
        recurrence: String? = nil,
        completedAt: String? = nil,
        plantingServerId: Int? = nil,
        yardElementServerId: Int? = nil,
        taskType: String? = nil,
        updatedAt: String? = nil
    ) {
        self.serverId = serverId
        self.title = title
        self.taskDescription = taskDescription
        self.dueDate = dueDate
        self.recurrence = recurrence
        self.completedAt = completedAt
        self.plantingServerId = plantingServerId
        self.yardElementServerId = yardElementServerId
        self.taskType = taskType
        self.updatedAt = updatedAt
    }
}
