import SwiftUI
import SwiftData

struct YardCanvasView: View {
    let yard: Yard
    let elements: [YardElement]
    let onSelectElement: (YardElement?) -> Void

    @State private var scale: CGFloat = 1.0
    @State private var baseScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var panStart: CGSize = .zero
    @State private var selectedElementId: PersistentIdentifier?

    // Drag state
    @State private var isDragging = false
    @State private var draggingElementId: PersistentIdentifier?
    @State private var dragOffset: CGSize = .zero
    @State private var dragElementOrigX: Int = 0
    @State private var dragElementOrigY: Int = 0

    // Grid constants
    private let cellSize: CGFloat = 40 // pts per foot

    private var canvasWidth: CGFloat { CGFloat(yard.widthFt) * cellSize }
    private var canvasHeight: CGFloat { CGFloat(yard.heightFt) * cellSize }

    var body: some View {
        GeometryReader { geo in
            Canvas { context, size in
                let (_, scaledCell, origin) = layoutValues(geoSize: size)

                // Background
                let bgRect = CGRect(
                    x: origin.x, y: origin.y,
                    width: CGFloat(yard.widthFt) * scaledCell,
                    height: CGFloat(yard.heightFt) * scaledCell
                )
                context.fill(Path(bgRect), with: .color(Color(.systemBackground)))

                // Grid
                drawGrid(context: context, origin: origin, scaledCell: scaledCell)

                // Elements
                for element in elements {
                    var ex = origin.x + CGFloat(element.x) * scaledCell
                    var ey = origin.y + CGFloat(element.y) * scaledCell

                    // Apply visual drag offset (snapped to grid)
                    if element.id == draggingElementId {
                        let snappedDx = round(dragOffset.width / scaledCell) * scaledCell
                        let snappedDy = round(dragOffset.height / scaledCell) * scaledCell
                        ex += snappedDx
                        ey += snappedDy
                    }

                    let rect = CGRect(
                        x: ex, y: ey,
                        width: CGFloat(element.width) * scaledCell,
                        height: CGFloat(element.height) * scaledCell
                    )
                    let effectiveScale = scaledCell / cellSize
                    drawElement(context: context, element: element, rect: rect, scale: effectiveScale)
                }
            }
            .gesture(
                DragGesture(minimumDistance: 5)
                    .onChanged { value in
                        handleDragChanged(value: value, geoSize: geo.size)
                    }
                    .onEnded { value in
                        handleDragEnded(value: value, geoSize: geo.size)
                    }
            )
            .simultaneousGesture(
                MagnifyGesture()
                    .onChanged { value in
                        scale = max(0.3, min(5.0, baseScale * value.magnification))
                    }
                    .onEnded { value in
                        baseScale = max(0.3, min(5.0, baseScale * value.magnification))
                        scale = baseScale
                    }
            )
            .onTapGesture { location in
                handleTap(at: location, geoSize: geo.size)
            }
        }
    }

    // MARK: - Layout

    private func layoutValues(geoSize: CGSize) -> (fitScale: CGFloat, scaledCell: CGFloat, origin: CGPoint) {
        let fitScale = min(
            geoSize.width / canvasWidth,
            geoSize.height / canvasHeight
        ) * 0.95
        let currentScale = fitScale * scale
        let scaledCell = cellSize * currentScale
        let totalWidth = canvasWidth * currentScale
        let totalHeight = canvasHeight * currentScale
        let originX = (geoSize.width - totalWidth) / 2 + offset.width
        let originY = (geoSize.height - totalHeight) / 2 + offset.height
        return (fitScale, scaledCell, CGPoint(x: originX, y: originY))
    }

    // MARK: - Drag Handling

    private func handleDragChanged(value: DragGesture.Value, geoSize: CGSize) {
        if !isDragging {
            isDragging = true
            if let hit = elementAt(value.startLocation, geoSize: geoSize) {
                draggingElementId = hit.id
                selectedElementId = hit.id
                dragElementOrigX = hit.x
                dragElementOrigY = hit.y
                dragOffset = .zero
            } else {
                draggingElementId = nil
                panStart = offset
            }
        }

        if draggingElementId != nil {
            dragOffset = value.translation
        } else {
            offset = CGSize(
                width: panStart.width + value.translation.width,
                height: panStart.height + value.translation.height
            )
        }
    }

    private func handleDragEnded(value: DragGesture.Value, geoSize: CGSize) {
        if let elId = draggingElementId,
           let element = elements.first(where: { $0.id == elId }) {
            let (_, scaledCell, _) = layoutValues(geoSize: geoSize)
            let dx = Int(round(dragOffset.width / scaledCell))
            let dy = Int(round(dragOffset.height / scaledCell))
            element.x = max(0, min(yard.widthFt - element.width, dragElementOrigX + dx))
            element.y = max(0, min(yard.heightFt - element.height, dragElementOrigY + dy))
            element.updatedAt = ISO8601DateFormatter().string(from: Date())
        }
        isDragging = false
        draggingElementId = nil
        dragOffset = .zero
    }

    // MARK: - Tap Handling

    private func handleTap(at location: CGPoint, geoSize: CGSize) {
        if let element = elementAt(location, geoSize: geoSize) {
            selectedElementId = element.id
            onSelectElement(element)
        } else {
            selectedElementId = nil
            onSelectElement(nil)
        }
    }

    // MARK: - Hit Test

    private func elementAt(_ point: CGPoint, geoSize: CGSize) -> YardElement? {
        let (_, scaledCell, origin) = layoutValues(geoSize: geoSize)
        let gridX = (point.x - origin.x) / scaledCell
        let gridY = (point.y - origin.y) / scaledCell

        for element in elements.reversed() {
            let ex = CGFloat(element.x)
            let ey = CGFloat(element.y)
            let ew = CGFloat(element.width)
            let eh = CGFloat(element.height)

            if gridX >= ex && gridX <= ex + ew && gridY >= ey && gridY <= ey + eh {
                return element
            }
        }
        return nil
    }

    // MARK: - Grid

    private func drawGrid(context: GraphicsContext, origin: CGPoint, scaledCell: CGFloat) {
        var gridPath = Path()
        for i in 0...yard.widthFt {
            let x = origin.x + CGFloat(i) * scaledCell
            gridPath.move(to: CGPoint(x: x, y: origin.y))
            gridPath.addLine(to: CGPoint(x: x, y: origin.y + CGFloat(yard.heightFt) * scaledCell))
        }
        for j in 0...yard.heightFt {
            let y = origin.y + CGFloat(j) * scaledCell
            gridPath.move(to: CGPoint(x: origin.x, y: y))
            gridPath.addLine(to: CGPoint(x: origin.x + CGFloat(yard.widthFt) * scaledCell, y: y))
        }
        context.stroke(gridPath, with: .color(.gray.opacity(0.2)), lineWidth: 0.5)

        let border = CGRect(
            x: origin.x, y: origin.y,
            width: CGFloat(yard.widthFt) * scaledCell,
            height: CGFloat(yard.heightFt) * scaledCell
        )
        context.stroke(Path(border), with: .color(.gray.opacity(0.5)), lineWidth: 1)
    }

    // MARK: - Element Drawing

    private func drawElement(context: GraphicsContext, element: YardElement, rect: CGRect, scale: CGFloat) {
        let spec = shapeConfig[element.shapeType]
        let fillColor = spec?.fillColor ?? Color.garden200
        let borderColor = spec?.borderColor ?? Color.garden700
        let isSelected = element.id == selectedElementId
        let isDragged = element.id == draggingElementId

        switch element.shapeType {
        case "circle", "mandala":
            let ellipse = Path(ellipseIn: rect)
            context.fill(ellipse, with: .color(fillColor.opacity(isDragged ? 0.8 : 0.6)))
            context.stroke(ellipse, with: .color(isSelected ? .blue : borderColor), lineWidth: isSelected ? 2.5 : 1.5)

        case "keyhole":
            var keyPath = Path()
            let cx = rect.midX
            let cy = rect.midY
            let rx = rect.width / 2
            let notchWidth = rx * 0.3
            let notchAngle = asin(notchWidth / rx)
            let startAngle = Angle(radians: .pi / 2 - Double(notchAngle))
            let endAngle = Angle(radians: .pi / 2 + Double(notchAngle))

            keyPath.addArc(center: CGPoint(x: cx, y: cy), radius: rx, startAngle: endAngle, endAngle: startAngle, clockwise: true)
            keyPath.addLine(to: CGPoint(x: cx + notchWidth, y: cy))
            keyPath.addLine(to: CGPoint(x: cx - notchWidth, y: cy))
            keyPath.closeSubpath()

            context.fill(keyPath, with: .color(fillColor.opacity(isDragged ? 0.8 : 0.6)))
            context.stroke(keyPath, with: .color(isSelected ? .blue : borderColor), lineWidth: isSelected ? 2.5 : 1.5)

            let compostRadius = min(rx, rect.height / 2) * 0.2
            let compost = Path(ellipseIn: CGRect(x: cx - compostRadius, y: cy - compostRadius, width: compostRadius * 2, height: compostRadius * 2))
            context.fill(compost, with: .color(borderColor.opacity(0.3)))
            context.stroke(compost, with: .color(borderColor), lineWidth: 1)

        case "spiral":
            let ellipse = Path(ellipseIn: rect)
            context.fill(ellipse, with: .color(fillColor.opacity(isDragged ? 0.8 : 0.6)))
            context.stroke(ellipse, with: .color(isSelected ? .blue : borderColor), lineWidth: isSelected ? 2.5 : 1.5)

            let cx = rect.midX
            let cy = rect.midY
            let maxR = min(rect.width, rect.height) / 2 * 0.7
            var spiralPath = Path()
            var first = true
            for i in stride(from: 0.0, through: 4 * Double.pi, by: 0.2) {
                let r = maxR * CGFloat(i / (4 * Double.pi))
                let px = cx + r * cos(CGFloat(i))
                let py = cy + r * sin(CGFloat(i))
                if first { spiralPath.move(to: CGPoint(x: px, y: py)); first = false }
                else { spiralPath.addLine(to: CGPoint(x: px, y: py)) }
            }
            context.stroke(spiralPath, with: .color(borderColor.opacity(0.4)), lineWidth: 1)

        case "hugelkultur":
            var mound = Path()
            mound.move(to: CGPoint(x: rect.minX, y: rect.maxY))
            mound.addQuadCurve(
                to: CGPoint(x: rect.maxX, y: rect.maxY),
                control: CGPoint(x: rect.midX, y: rect.minY)
            )
            mound.closeSubpath()
            context.fill(mound, with: .color(fillColor.opacity(isDragged ? 0.8 : 0.6)))
            context.stroke(mound, with: .color(isSelected ? .blue : borderColor), lineWidth: isSelected ? 2.5 : 1.5)

        case "water":
            let ellipse = Path(ellipseIn: rect.insetBy(dx: rect.width * 0.1, dy: rect.height * 0.1))
            context.fill(ellipse, with: .color(fillColor.opacity(isDragged ? 0.9 : 0.7)))
            context.stroke(ellipse, with: .color(isSelected ? .blue : borderColor), lineWidth: isSelected ? 2.5 : 1.5)

        default:
            let rrect = Path(roundedRect: rect, cornerRadius: 3 * scale)
            context.fill(rrect, with: .color(fillColor.opacity(isDragged ? 0.8 : 0.6)))
            context.stroke(rrect, with: .color(isSelected ? .blue : borderColor), lineWidth: isSelected ? 2.5 : 1.5)
        }

        // Label
        if let label = element.label, !label.isEmpty {
            let fontSize = max(8, 11 * scale)
            context.draw(
                Text(label)
                    .font(.system(size: fontSize, weight: .medium))
                    .foregroundColor(borderColor),
                at: CGPoint(x: rect.midX, y: rect.midY),
                anchor: .center
            )
        }

        // Selection handles
        if isSelected {
            let handleSize: CGFloat = 6
            let corners = [
                CGPoint(x: rect.minX, y: rect.minY),
                CGPoint(x: rect.maxX, y: rect.minY),
                CGPoint(x: rect.minX, y: rect.maxY),
                CGPoint(x: rect.maxX, y: rect.maxY),
            ]
            for corner in corners {
                let handleRect = CGRect(
                    x: corner.x - handleSize / 2,
                    y: corner.y - handleSize / 2,
                    width: handleSize,
                    height: handleSize
                )
                context.fill(Path(handleRect), with: .color(.white))
                context.stroke(Path(handleRect), with: .color(.blue), lineWidth: 1.5)
            }
        }
    }
}
