import SwiftUI

struct ShapeSpec {
    let label: String
    let description: String
    let fillColor: Color
    let borderColor: Color
    let defaultWidth: Int
    let defaultHeight: Int
    let plantable: Bool
    let icon: String
}

let shapeConfig: [String: ShapeSpec] = [
    "rectangle": ShapeSpec(
        label: "Raised Bed", description: "Rectangular raised bed or row garden",
        fillColor: Color(red: 0.525, green: 0.937, blue: 0.675),
        borderColor: Color(red: 0.082, green: 0.502, blue: 0.239),
        defaultWidth: 4, defaultHeight: 8, plantable: true, icon: "rectangle"
    ),
    "circle": ShapeSpec(
        label: "Round Bed", description: "Circular garden bed",
        fillColor: Color(red: 0.733, green: 0.969, blue: 0.816),
        borderColor: Color(red: 0.086, green: 0.396, blue: 0.204),
        defaultWidth: 6, defaultHeight: 6, plantable: true, icon: "circle"
    ),
    "keyhole": ShapeSpec(
        label: "Keyhole Garden", description: "Circular bed with access notch",
        fillColor: Color(red: 0.992, green: 0.902, blue: 0.541),
        borderColor: Color(red: 0.573, green: 0.251, blue: 0.055),
        defaultWidth: 6, defaultHeight: 6, plantable: true, icon: "circle.bottomhalf.filled"
    ),
    "spiral": ShapeSpec(
        label: "Herb Spiral", description: "Spiral bed with height variation",
        fillColor: Color(red: 0.769, green: 0.710, blue: 0.992),
        borderColor: Color(red: 0.357, green: 0.129, blue: 0.714),
        defaultWidth: 5, defaultHeight: 5, plantable: true, icon: "hurricane"
    ),
    "hugelkultur": ShapeSpec(
        label: "Hugelkultur", description: "Mounded bed on decomposing wood",
        fillColor: Color(red: 0.831, green: 0.773, blue: 0.682),
        borderColor: Color(red: 0.427, green: 0.357, blue: 0.251),
        defaultWidth: 4, defaultHeight: 10, plantable: true, icon: "mountain.2"
    ),
    "mandala": ShapeSpec(
        label: "Mandala Garden", description: "Circular design with keyhole paths",
        fillColor: Color(red: 0.984, green: 0.812, blue: 0.910),
        borderColor: Color(red: 0.616, green: 0.090, blue: 0.302),
        defaultWidth: 10, defaultHeight: 10, plantable: true, icon: "sun.max"
    ),
    "container": ShapeSpec(
        label: "Container", description: "Pot, grow bag, or window box",
        fillColor: Color(red: 0.996, green: 0.843, blue: 0.667),
        borderColor: Color(red: 0.761, green: 0.255, blue: 0.047),
        defaultWidth: 2, defaultHeight: 2, plantable: true, icon: "cup.and.saucer"
    ),
    "path": ShapeSpec(
        label: "Path", description: "Walkway or pathway",
        fillColor: Color(red: 0.898, green: 0.906, blue: 0.922),
        borderColor: Color(red: 0.420, green: 0.451, blue: 0.502),
        defaultWidth: 2, defaultHeight: 6, plantable: false, icon: "road.lanes"
    ),
    "structure": ShapeSpec(
        label: "Structure", description: "House, shed, fence, or deck",
        fillColor: Color(red: 0.820, green: 0.835, blue: 0.855),
        borderColor: Color(red: 0.216, green: 0.255, blue: 0.318),
        defaultWidth: 4, defaultHeight: 4, plantable: false, icon: "building"
    ),
    "water": ShapeSpec(
        label: "Water Source", description: "Spigot, hose bib, or irrigation point",
        fillColor: Color(red: 0.576, green: 0.773, blue: 0.992),
        borderColor: Color(red: 0.114, green: 0.306, blue: 0.847),
        defaultWidth: 1, defaultHeight: 1, plantable: false, icon: "drop.fill"
    ),
]

let shapeTypeOrder = [
    "rectangle", "circle", "keyhole", "spiral", "hugelkultur",
    "mandala", "container", "path", "structure", "water",
]
