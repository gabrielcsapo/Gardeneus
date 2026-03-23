//
//  GardeneusApp.swift
//  Gardeneus
//
//  Created by Gabriel Csapo on 2/8/26.
//

import SwiftUI
import SwiftData

@main
struct GardeneusApp: App {
    @State private var serverDiscovery = ServerDiscovery()

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Settings.self,
            Yard.self,
            YardElement.self,
            Plant.self,
            Planting.self,
            LogEntry.self,
            SeedInventoryItem.self,
            GardenTask.self,
            PestDisease.self,
            SoilProfile.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(serverDiscovery)
        }
        .modelContainer(sharedModelContainer)
    }
}
