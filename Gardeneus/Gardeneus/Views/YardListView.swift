import SwiftUI
import SwiftData

struct YardListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var yards: [Yard]
    @Query private var elements: [YardElement]

    var body: some View {
        NavigationStack {
            ScrollView {
                if yards.isEmpty {
                    emptyState
                } else {
                    LazyVStack(spacing: 16) {
                        ForEach(yards, id: \.id) { yard in
                            NavigationLink {
                                YardEditorView(yard: yard)
                            } label: {
                                YardCard(yard: yard, elements: elementsForYard(yard))
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                NavigationLink {
                                    BedWalkthroughView(yard: yard)
                                } label: {
                                    Label("Bed Walkthrough", systemImage: "list.bullet")
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Yards")
        }
    }

    private func elementsForYard(_ yard: Yard) -> [YardElement] {
        guard let serverId = yard.serverId else { return [] }
        return elements.filter { $0.yardServerId == serverId }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "square.grid.2x2")
                .font(.system(size: 48))
                .foregroundStyle(.gardenGreen)
            Text("No Yards Yet")
                .font(.title3.weight(.semibold))
            Text("Sync with your garden server to see your yards here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 60)
    }
}

// MARK: - Yard Card

private struct YardCard: View {
    let yard: Yard
    let elements: [YardElement]

    private let shapeColors: [String: Color] = [
        "rectangle": .garden600,
        "circle": .garden500,
        "keyhole": .earth600,
        "spiral": .garden700,
        "hugelkultur": .earth700,
        "mandala": .garden400,
        "container": .earth500,
        "path": .earth300,
        "structure": .gray,
        "water": .blue,
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Mini canvas preview
            Canvas { context, size in
                let scaleX = size.width / CGFloat(yard.widthFt)
                let scaleY = size.height / CGFloat(yard.heightFt)
                let scale = min(scaleX, scaleY)

                // Grid
                context.stroke(
                    Path { path in
                        for i in 0...yard.widthFt {
                            let x = CGFloat(i) * scale
                            path.move(to: CGPoint(x: x, y: 0))
                            path.addLine(to: CGPoint(x: x, y: CGFloat(yard.heightFt) * scale))
                        }
                        for j in 0...yard.heightFt {
                            let y = CGFloat(j) * scale
                            path.move(to: CGPoint(x: 0, y: y))
                            path.addLine(to: CGPoint(x: CGFloat(yard.widthFt) * scale, y: y))
                        }
                    },
                    with: .color(.gray.opacity(0.15)),
                    lineWidth: 0.5
                )

                // Elements
                for element in elements {
                    let rect = CGRect(
                        x: CGFloat(element.x) * scale,
                        y: CGFloat(element.y) * scale,
                        width: CGFloat(element.width) * scale,
                        height: CGFloat(element.height) * scale
                    )
                    let color = shapeColors[element.shapeType] ?? .garden600

                    if element.shapeType == "circle" {
                        let ellipse = Path(ellipseIn: rect)
                        context.fill(ellipse, with: .color(color.opacity(0.3)))
                        context.stroke(ellipse, with: .color(color), lineWidth: 1)
                    } else {
                        let rrect = Path(roundedRect: rect, cornerRadius: 2)
                        context.fill(rrect, with: .color(color.opacity(0.3)))
                        context.stroke(rrect, with: .color(color), lineWidth: 1)
                    }
                }
            }
            .frame(height: 160)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Info
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(yard.name)
                        .font(.headline)
                    Text("\(yard.widthFt) x \(yard.heightFt) ft")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                HStack(spacing: 4) {
                    Image(systemName: "square.grid.2x2")
                        .font(.caption)
                    Text("\(elements.count)")
                        .font(.caption.weight(.medium))
                }
                .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Bed Walkthrough

struct BedWalkthroughView: View {
    let yard: Yard

    @Environment(\.modelContext) private var modelContext
    @Query private var allElements: [YardElement]
    @Query private var allPlantings: [Planting]
    @Query private var allPlants: [Plant]

    @State private var currentIndex = 0

    private var elements: [YardElement] {
        guard let serverId = yard.serverId else { return [] }
        return allElements.filter { $0.yardServerId == serverId }
    }

    var body: some View {
        VStack(spacing: 0) {
            if elements.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "square.dashed")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                    Text("No beds in this yard")
                        .font(.headline)
                    Text("Add beds from the web app and sync.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 60)
            } else {
                TabView(selection: $currentIndex) {
                    ForEach(Array(elements.enumerated()), id: \.element.id) { index, element in
                        BedDetailCard(
                            element: element,
                            plantings: plantingsForElement(element),
                            plants: allPlants
                        )
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))

                // Bed counter
                Text("\(currentIndex + 1) of \(elements.count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 8)
            }
        }
        .navigationTitle(yard.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func plantingsForElement(_ element: YardElement) -> [Planting] {
        guard let serverId = element.serverId else { return [] }
        return allPlantings.filter { $0.yardElementServerId == serverId && $0.status != "done" && $0.status != "removed" }
    }
}

// MARK: - Bed Detail Card

private struct BedDetailCard: View {
    let element: YardElement
    let plantings: [Planting]
    let plants: [Plant]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Bed header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(element.label ?? "Bed #\(element.serverId ?? 0)")
                            .font(.title3.weight(.semibold))
                        HStack(spacing: 8) {
                            Label(element.shapeType.capitalized, systemImage: iconForShape(element.shapeType))
                            if let sun = element.sunExposure {
                                Label(sun.capitalized, systemImage: "sun.max.fill")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(element.width) x \(element.height) ft")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.regularMaterial, in: Capsule())
                }

                // Modifiers
                if element.seasonExtension != nil || element.irrigationType != nil || element.mulched {
                    HStack(spacing: 8) {
                        if let ext = element.seasonExtension, ext != "none" {
                            ModifierBadge(icon: "thermometer.snowflake", text: ext.replacingOccurrences(of: "_", with: " ").capitalized)
                        }
                        if let irr = element.irrigationType, irr != "none" {
                            ModifierBadge(icon: "drop.fill", text: irr.replacingOccurrences(of: "_", with: " ").capitalized)
                        }
                        if element.mulched {
                            ModifierBadge(icon: "leaf.fill", text: "Mulched")
                        }
                    }
                }

                Divider()

                // Plantings
                if plantings.isEmpty {
                    HStack {
                        Spacer()
                        VStack(spacing: 8) {
                            Image(systemName: "leaf")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                            Text("No active plantings")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 20)
                        Spacer()
                    }
                } else {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Active Plantings (\(plantings.count))")
                            .font(.subheadline.weight(.semibold))

                        ForEach(plantings, id: \.id) { planting in
                            let plant = plants.first { $0.serverId == planting.plantServerId }
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(statusColor(planting.status))
                                    .frame(width: 8, height: 8)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(plant?.name ?? "Unknown Plant")
                                        .font(.subheadline.weight(.medium))
                                    HStack(spacing: 6) {
                                        if let status = planting.status {
                                            Text(status.capitalized)
                                        }
                                        if planting.quantity > 1 {
                                            Text("x\(planting.quantity)")
                                        }
                                    }
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                }

                                Spacer()

                                if let date = planting.plantedDate {
                                    Text(date)
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            .padding(.vertical, 6)
                        }
                    }
                }
            }
            .padding()
        }
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }

    private func statusColor(_ status: String?) -> Color {
        switch status {
        case "planted": return .garden500
        case "germinated": return .garden400
        case "growing": return .garden600
        case "harvesting": return .orange
        case "planned": return .blue
        default: return .gray
        }
    }

    private func iconForShape(_ shape: String) -> String {
        switch shape {
        case "circle": return "circle"
        case "container": return "cup.and.saucer"
        case "path": return "road.lanes"
        case "structure": return "building"
        case "water": return "drop.fill"
        default: return "rectangle"
        }
    }
}

// MARK: - Modifier Badge

private struct ModifierBadge: View {
    let icon: String
    let text: String

    var body: some View {
        Label(text, systemImage: icon)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.garden50.opacity(0.5), in: Capsule())
            .foregroundStyle(Color.garden700)
    }
}
