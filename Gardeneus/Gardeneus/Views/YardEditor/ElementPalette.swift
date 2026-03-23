import SwiftUI

struct ElementPalette: View {
    let onSelect: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(shapeTypeOrder, id: \.self) { shapeType in
                    if let spec = shapeConfig[shapeType] {
                        PaletteItem(shapeType: shapeType, spec: spec) {
                            onSelect(shapeType)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(.ultraThinMaterial)
    }
}

private struct PaletteItem: View {
    let shapeType: String
    let spec: ShapeSpec
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(spec.fillColor.opacity(0.4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(spec.borderColor, lineWidth: 1)
                    )
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: spec.icon)
                            .font(.system(size: 18))
                            .foregroundStyle(spec.borderColor)
                    )

                Text(spec.label)
                    .font(.caption2)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
            }
            .frame(width: 64)
        }
        .buttonStyle(.plain)
    }
}
