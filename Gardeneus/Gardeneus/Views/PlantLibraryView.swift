//
//  PlantLibraryView.swift
//  Gardeneus
//

import SwiftUI
import SwiftData

struct PlantLibraryView: View {
    @Query(sort: \Plant.name) private var plants: [Plant]
    @State private var searchText = ""
    @State private var selectedCategory: String?
    @State private var selectedPlant: Plant?

    private var categories: [String] {
        let cats = Set(plants.compactMap { $0.category })
        return Array(cats).sorted()
    }

    private var filteredPlants: [Plant] {
        plants.filter { plant in
            let matchesSearch = searchText.isEmpty ||
                plant.name.localizedCaseInsensitiveContains(searchText) ||
                (plant.variety?.localizedCaseInsensitiveContains(searchText) ?? false)
            let matchesCategory = selectedCategory == nil || plant.category == selectedCategory
            return matchesSearch && matchesCategory
        }
    }

    var body: some View {
        NavigationStack {
            List {
                // Category pills
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        CategoryPill(label: "All", isSelected: selectedCategory == nil) {
                            selectedCategory = nil
                        }
                        ForEach(categories, id: \.self) { cat in
                            CategoryPill(
                                label: categoryLabel(cat),
                                isSelected: selectedCategory == cat
                            ) {
                                selectedCategory = selectedCategory == cat ? nil : cat
                            }
                        }
                    }
                    .padding(.horizontal, 4)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
                .listRowSeparator(.hidden)

                // Plant rows
                ForEach(filteredPlants, id: \.id) { plant in
                    Button {
                        selectedPlant = plant
                    } label: {
                        PlantRow(plant: plant)
                    }
                    .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                }
            }
            .listStyle(.plain)
            .searchable(text: $searchText, prompt: "Search plants...")
            .navigationTitle("Plants")
            .sheet(isPresented: Binding(
                get: { selectedPlant != nil },
                set: { if !$0 { selectedPlant = nil } }
            )) {
                if let plant = selectedPlant {
                    PlantDetailView(plant: plant)
                }
            }
        }
    }

    private func categoryLabel(_ cat: String) -> String {
        let labels: [String: String] = [
            "vegetable": "Vegetable",
            "fruit": "Fruit",
            "herb": "Herb",
            "legume": "Legume",
            "root": "Root",
            "leafy_green": "Leafy Green",
            "allium": "Allium",
            "brassica": "Brassica",
            "flower": "Flower",
        ]
        return labels[cat] ?? cat.capitalized
    }
}

// MARK: - Category Pill

private struct CategoryPill: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.caption.weight(.medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    isSelected ? Color.gardenPrimary : Color.earth100,
                    in: Capsule()
                )
                .foregroundStyle(isSelected ? .white : .primary)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Plant Row

private struct PlantRow: View {
    let plant: Plant

    private var categoryColor: Color {
        switch plant.category {
        case "vegetable": return .garden600
        case "fruit": return .pink
        case "herb": return .purple
        case "legume": return .orange
        case "root": return .brown
        case "leafy_green": return .mint
        case "allium": return .indigo
        case "brassica": return .teal
        case "flower": return .pink
        default: return .gray
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            // Category color indicator
            Circle()
                .fill(categoryColor)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(plant.name)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.primary)

                HStack(spacing: 8) {
                    if let category = plant.category {
                        Text(categoryLabel(category))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let days = plant.daysToHarvest {
                        Text("\(days)d harvest")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            if let sun = plant.waterNeeds {
                Text(sunIcon(sun))
                    .font(.caption)
            }

            Image(systemName: "chevron.right")
                .font(.caption2)
                .foregroundStyle(.quaternary)
        }
        .padding(.vertical, 4)
    }

    private func categoryLabel(_ cat: String) -> String {
        let labels: [String: String] = [
            "vegetable": "Vegetable", "fruit": "Fruit", "herb": "Herb",
            "legume": "Legume", "root": "Root", "leafy_green": "Leafy Green",
            "allium": "Allium", "brassica": "Brassica", "flower": "Flower",
        ]
        return labels[cat] ?? cat.capitalized
    }

    private func sunIcon(_ needs: String) -> String {
        switch needs {
        case "high": return "💧💧"
        case "medium": return "💧"
        case "low": return "🏜️"
        default: return ""
        }
    }
}

// MARK: - Plant Detail View

struct PlantDetailView: View {
    let plant: Plant
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    HStack(spacing: 12) {
                        Image(systemName: "leaf.fill")
                            .font(.title)
                            .foregroundStyle(.gardenGreen)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(plant.name)
                                .font(.title2.weight(.bold))
                            if let variety = plant.variety {
                                Text(variety)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    if let desc = plant.plantDescription {
                        Text(desc)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    // Stats grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                    ], spacing: 8) {
                        if let days = plant.daysToHarvest {
                            DetailStat(label: "Harvest", value: "\(days) days", icon: "clock")
                        }
                        if let spacing = plant.spacingInches {
                            DetailStat(label: "Spacing", value: "\(spacing)\"", icon: "ruler")
                        }
                        if let water = plant.waterNeeds {
                            DetailStat(label: "Water", value: water.replacingOccurrences(of: "_", with: " ").capitalized, icon: "drop")
                        }
                        if let frost = plant.frostTolerance {
                            DetailStat(label: "Frost", value: frost.replacingOccurrences(of: "_", with: " ").capitalized, icon: "thermometer.snowflake")
                        }
                        if let family = plant.family {
                            DetailStat(label: "Family", value: family, icon: "leaf.circle")
                        }
                        if let yield_ = plant.expectedYieldPerPlant {
                            DetailStat(label: "Yield", value: "\(Int(yield_)) \(plant.expectedYieldUnit ?? "")/plant", icon: "basket")
                        }
                    }

                    // Companions
                    if let companions = plant.companions, !companions.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Companions")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)

                            FlowLayout(spacing: 6) {
                                ForEach(companions, id: \.self) { name in
                                    Text(name)
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(Color.garden50, in: Capsule())
                                        .foregroundStyle(Color.garden700)
                                }
                            }
                        }
                    }

                    // Incompatible
                    if let incompatible = plant.incompatible, !incompatible.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Avoid Near")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)

                            FlowLayout(spacing: 6) {
                                ForEach(incompatible, id: \.self) { name in
                                    Text(name)
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(Color.red.opacity(0.1), in: Capsule())
                                        .foregroundStyle(.red)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle(plant.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Detail Stat

private struct DetailStat: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.gardenGreen)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.caption.weight(.medium))
            }
            Spacer()
        }
        .padding(10)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Flow Layout

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(proposal: proposal, subviews: subviews)
        for (index, offset) in result.offsets.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + offset.x, y: bounds.minY + offset.y), proposal: .unspecified)
        }
    }

    private func layout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, offsets: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var offsets: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxX: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            offsets.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
            maxX = max(maxX, x)
        }

        return (CGSize(width: maxX, height: y + rowHeight), offsets)
    }
}

