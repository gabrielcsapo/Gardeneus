import Foundation
import SwiftData

@Model
final class PestDisease {
    var serverId: Int?
    var name: String
    var type: String
    var pestDescription: String?
    var symptoms: String?
    var organicTreatments: [String]?
    var preventionTips: [String]?
    var affectedPlants: [String]?
    var beneficialPredators: [String]?
    var activeMonths: [Int]?

    init(
        serverId: Int? = nil,
        name: String = "",
        type: String = "pest",
        pestDescription: String? = nil,
        symptoms: String? = nil,
        organicTreatments: [String]? = nil,
        preventionTips: [String]? = nil,
        affectedPlants: [String]? = nil,
        beneficialPredators: [String]? = nil,
        activeMonths: [Int]? = nil
    ) {
        self.serverId = serverId
        self.name = name
        self.type = type
        self.pestDescription = pestDescription
        self.symptoms = symptoms
        self.organicTreatments = organicTreatments
        self.preventionTips = preventionTips
        self.affectedPlants = affectedPlants
        self.beneficialPredators = beneficialPredators
        self.activeMonths = activeMonths
    }
}
