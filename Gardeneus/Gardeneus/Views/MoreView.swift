//
//  MoreView.swift
//  Gardeneus
//

import SwiftUI

struct MoreView: View {
    var syncEngine: SyncEngine?

    var body: some View {
        NavigationStack {
            List {
                Section("Garden") {
                    NavigationLink {
                        PlantLibraryView()
                    } label: {
                        Label("Plants", systemImage: "leaf.circle")
                            .foregroundStyle(.primary)
                    }

                    NavigationLink {
                        CalendarView()
                    } label: {
                        Label("Calendar", systemImage: "calendar")
                            .foregroundStyle(.primary)
                    }
                }

                Section {
                    NavigationLink {
                        SettingsView(syncEngine: syncEngine)
                    } label: {
                        Label("Settings", systemImage: "gearshape")
                            .foregroundStyle(.primary)
                    }
                }
            }
            .navigationTitle("More")
        }
    }
}
