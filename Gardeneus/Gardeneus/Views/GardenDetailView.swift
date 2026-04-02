import SwiftUI

struct GardenDetailView: View {
    let yard: Yard

    var body: some View {
        TabView {
            Tab("Garden", systemImage: "map") {
                YardEditorView(yard: yard)
            }
            Tab("Calendar", systemImage: "calendar") {
                CalendarView(yard: yard)
            }
            Tab("Tasks", systemImage: "checklist") {
                TaskListView(yard: yard)
            }
            Tab("Log", systemImage: "note.text") {
                QuickLogView(yard: yard)
            }
        }
        .navigationTitle(yard.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
