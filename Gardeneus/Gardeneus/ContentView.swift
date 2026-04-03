//
//  ContentView.swift
//  Gardeneus
//
//  Created by Gabriel Csapo on 2/8/26.
//

import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.scenePhase) private var scenePhase
    @Environment(ServerDiscovery.self) private var serverDiscovery

    @State private var selectedTab = 0
    @State private var syncEngine: SyncEngine?

    var body: some View {
        if serverDiscovery.isConfigured {
            TabView(selection: $selectedTab) {
                Tab("Garden", systemImage: "leaf.fill", value: 0) {
                    YardListView()
                }

                Tab("More", systemImage: "ellipsis.circle", value: 1) {
                    MoreView(syncEngine: syncEngine)
                }
            }
            .tint(Color("GardenGreen"))
            .background(Color(.systemBackground))
            .ignoresSafeArea()
            .task {
                await initSyncEngine()
            }
            .onChange(of: scenePhase) { _, newPhase in
                if newPhase == .active {
                    Task {
                        await serverDiscovery.testConnection()
                        if serverDiscovery.isConnected {
                            await syncEngine?.autoSyncIfNeeded()
                        }
                    }
                }
            }
        } else {
            ServerSetupView()
        }
    }

    private func initSyncEngine() async {
        await serverDiscovery.testConnection()
        if let client = serverDiscovery.makeAPIClient() {
            syncEngine = SyncEngine(apiClient: client, modelContext: modelContext)
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [
            Settings.self, Yard.self, YardElement.self, Plant.self,
            Planting.self, LogEntry.self, SeedInventoryItem.self,
            GardenTask.self, PestDisease.self, SoilProfile.self,
        ], inMemory: true)
        .environment(ServerDiscovery())
}
