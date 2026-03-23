import SwiftUI
import SwiftData

struct YardEditorView: View {
    let yard: Yard

    @Environment(\.modelContext) private var modelContext
    @Query private var allElements: [YardElement]

    @State private var selectedElement: YardElement?
    @State private var showPalette = false

    private var elements: [YardElement] {
        guard let serverId = yard.serverId else { return [] }
        return allElements.filter { $0.yardServerId == serverId }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Canvas
            YardCanvasView(
                yard: yard,
                elements: elements,
                onSelectElement: { element in
                    selectedElement = element
                }
            )

            // Bottom toolbar
            VStack(spacing: 0) {
                if showPalette {
                    ElementPalette { shapeType in
                        addElement(shapeType: shapeType)
                        showPalette = false
                    }
                }

                HStack {
                    Button {
                        showPalette.toggle()
                    } label: {
                        Label("Add", systemImage: "plus.circle.fill")
                            .font(.subheadline.weight(.medium))
                    }
                    .tint(.gardenGreen)

                    Spacer()

                    Text("\(elements.count) element\(elements.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Spacer()

                    Text("\(yard.widthFt) x \(yard.heightFt) ft")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial)
            }
        }
        .navigationTitle(yard.name)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedElement) { element in
            BedDetailSheet(element: element)
        }
    }

    private func addElement(shapeType: String) {
        let spec = shapeConfig[shapeType]
        let element = YardElement(
            yardServerId: yard.serverId,
            shapeType: shapeType,
            x: 1,
            y: 1,
            width: spec?.defaultWidth ?? 4,
            height: spec?.defaultHeight ?? 4,
            label: spec?.label,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        modelContext.insert(element)
    }
}
