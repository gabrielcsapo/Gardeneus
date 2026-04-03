import SwiftUI

struct GardenDetailView: View {
    let yard: Yard
    @State private var selectedTab = 0
    @State private var showSettings = false

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Garden", systemImage: "map", value: 0) {
                YardEditorView(yard: yard)
            }
            Tab("Calendar", systemImage: "calendar", value: 1) {
                CalendarView(yard: yard)
            }
            Tab("Tasks", systemImage: "checklist", value: 2) {
                TaskListView(yard: yard)
            }
            Tab("Log", systemImage: "note.text", value: 3) {
                QuickLogView(yard: yard)
            }
        }
        .tint(Color("GardenGreen"))
        .navigationTitle(yard.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink {
                    SettingsView()
                } label: {
                    Image(systemName: "gear")
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
